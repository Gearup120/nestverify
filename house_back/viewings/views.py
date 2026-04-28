from rest_framework import serializers, generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Viewing


class ViewingSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source='tenant.full_name', read_only=True)
    property_title = serializers.CharField(source='listing.title', read_only=True)
    property_id = serializers.CharField(source='listing.id', read_only=True)

    class Meta:
        model = Viewing
        fields = [
            'id', 'listing', 'property_id', 'property_title',
            'tenant', 'tenant_name',
            'scheduled_date', 'scheduled_time', 'message',
            'status', 'landlord_note', 'created_at',
        ]
        read_only_fields = ['id', 'tenant', 'status', 'landlord_note', 'created_at']


class BookViewingView(generics.CreateAPIView):
    serializer_class = ViewingSerializer
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user)

class MyViewingsView(generics.ListAPIView):
    serializer_class = ViewingSerializer
    def get_queryset(self):
        return Viewing.objects.filter(tenant=self.request.user)

class LandlordViewingsView(generics.ListAPIView):
    serializer_class = ViewingSerializer
    def get_queryset(self):
        return Viewing.objects.filter(listing__owner=self.request.user)

class RespondViewingView(APIView):
    def patch(self, request, pk):
        try:
            viewing = Viewing.objects.get(pk=pk, listing__owner=request.user)
        except Viewing.DoesNotExist:
            return Response({'error': 'Viewing not found.'}, status=404)
        action = request.data.get('action')
        if action == 'accept':
            viewing.status = 'accepted'
        elif action == 'decline':
            viewing.status = 'declined'
        else:
            return Response({'error': 'Action must be "accept" or "decline".'}, status=400)
        viewing.landlord_note = request.data.get('note', '')
        viewing.save()
        return Response(ViewingSerializer(viewing).data)

class CancelViewingView(APIView):
    def patch(self, request, pk):
        try:
            viewing = Viewing.objects.get(pk=pk, tenant=request.user)
        except Viewing.DoesNotExist:
            return Response({'error': 'Viewing not found.'}, status=404)
        viewing.status = 'cancelled'
        viewing.save()
        return Response({'message': 'Viewing cancelled.'})