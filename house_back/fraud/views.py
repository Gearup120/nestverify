from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import serializers
from .models import FraudReport
from .service import FraudDetectionService
from properties.models import Property


# ── Serializers ──────────────────────────────────────────────────────────────

class FraudReportSerializer(serializers.ModelSerializer):
    property_title = serializers.CharField(source='property.title', read_only=True)
    reporter_name = serializers.CharField(source='reported_by.full_name', read_only=True)

    class Meta:
        model = FraudReport
        fields = [
            'id', 'property', 'property_title', 'reported_by', 'reporter_name',
            'reason', 'status', 'admin_notes', 'auto_generated', 'created_at'
        ]
        read_only_fields = ['id', 'reported_by', 'status', 'admin_notes', 'auto_generated', 'created_at']


# ── Views ─────────────────────────────────────────────────────────────────────

class AnalyzePropertyView(APIView):
    """
    POST /api/fraud/analyze/<property_id>/
    Re-runs fraud analysis on a property and returns the result.
    Accessible by the property owner or any admin.
    """
    def post(self, request, property_id):
        try:
            prop = Property.objects.get(pk=property_id)
        except Property.DoesNotExist:
            return Response({'error': 'Property not found.'}, status=status.HTTP_404_NOT_FOUND)

        if prop.owner != request.user and not request.user.is_staff:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        service = FraudDetectionService()
        result = service.analyze_property(prop)

        # Persist updated scores
        prop.fraud_score = result['score']
        prop.fraud_flags = result['flags']
        prop.save(update_fields=['fraud_score', 'fraud_flags'])

        # Auto-create a fraud report if risk is HIGH
        if result['score'] >= 0.45:
            FraudReport.objects.get_or_create(
                property=prop,
                auto_generated=True,
                status='open',
                defaults={
                    'reason': f"Auto-flagged: {'; '.join(result['flags'])}",
                }
            )

        return Response({
            'property_id': str(prop.id),
            'fraud_score': result['score'],
            'flags': result['flags'],
            'recommendation': result['recommendation'],
        })


class ReportPropertyView(generics.CreateAPIView):
    """
    POST /api/fraud/report/
    Any authenticated user can file a manual fraud report on a listing.
    """
    serializer_class = FraudReportSerializer

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user, auto_generated=False)


class AdminFraudReportsView(generics.ListAPIView):
    """GET /api/fraud/admin/reports/ — all fraud reports (admin only)."""
    serializer_class = FraudReportSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = FraudReport.objects.select_related('property', 'reported_by')
        report_status = self.request.query_params.get('status')
        if report_status:
            qs = qs.filter(status=report_status)
        return qs


class AdminResolveReportView(APIView):
    """PATCH /api/fraud/admin/reports/<id>/resolve/"""
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, pk):
        try:
            report = FraudReport.objects.get(pk=pk)
        except FraudReport.DoesNotExist:
            return Response({'error': 'Report not found.'}, status=404)

        new_status = request.data.get('status')
        valid = ['investigating', 'resolved', 'dismissed']
        if new_status not in valid:
            return Response({'error': f'Status must be one of: {valid}'}, status=400)

        report.status = new_status
        report.admin_notes = request.data.get('admin_notes', report.admin_notes)
        report.save()
        return Response(FraudReportSerializer(report).data)
