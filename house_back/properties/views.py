from rest_framework import generics, permissions, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Property, PropertyImage, SavedProperty
from .serializers import PropertySerializer, PropertyListSerializer
from fraud.service import FraudDetectionService


class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user or request.user.is_staff


class PropertyListCreateView(generics.ListCreateAPIView):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['city', 'state', 'property_type', 'bedrooms', 'bathrooms', 'status']
    search_fields = ['title', 'description', 'address', 'city']
    ordering_fields = ['price', 'created_at', 'views_count']

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.is_staff:
            qs = Property.objects.all()
        else:
            qs = Property.objects.filter(status='approved')

        params = self.request.query_params

        # ── Price range ───────────────────────────────────────────────────────
        min_price = params.get('min_price')
        max_price = params.get('max_price')
        if min_price:
            try:
                qs = qs.filter(price__gte=float(min_price))
            except ValueError:
                pass
        if max_price:
            try:
                qs = qs.filter(price__lte=float(max_price))
            except ValueError:
                pass

        # ── Amenities (comma-separated) ───────────────────────────────────────
        amenities_param = params.get('amenities')
        if amenities_param:
            amenities = [a.strip() for a in amenities_param.split(',') if a.strip()]
            for amenity in amenities:
                qs = qs.filter(amenities__icontains=amenity)

        # ── Verified only ─────────────────────────────────────────────────────
        if params.get('verified') == 'true':
            qs = qs.filter(is_verified=True)

        return qs

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return PropertyListSerializer
        return PropertySerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        try:
            prop = serializer.save(owner=self.request.user)
            fraud_service = FraudDetectionService()
            result = fraud_service.analyze_property(prop)
            prop.fraud_score = result['score']
            prop.fraud_flags = result['flags']
            prop.status = 'pending'
            prop.save()
        except Exception as e:
            # We raise a validation error so DRF returns a 400 instead of a 500
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'detail': f"Operation failed: {str(e)}"})


class PropertyDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [IsOwnerOrAdmin()]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views_count += 1
        instance.save(update_fields=['views_count'])
        serializer = self.get_serializer(instance)
        data = serializer.data
        # Include saved status for authenticated users
        if request.user.is_authenticated:
            data['is_saved'] = SavedProperty.objects.filter(
                user=request.user, property=instance
            ).exists()
        else:
            data['is_saved'] = False
        return Response(data)


class MyPropertiesView(generics.ListAPIView):
    serializer_class = PropertyListSerializer

    def get_queryset(self):
        return Property.objects.filter(owner=self.request.user)


class AdminApprovePropertyView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, pk):
        try:
            prop = Property.objects.get(pk=pk)
        except Property.DoesNotExist:
            return Response({'error': 'Property not found.'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')
        if action == 'approve':
            prop.status = 'approved'
            prop.is_verified = True
            prop.save()
            return Response({'message': f'"{prop.title}" approved and now live.'})
        elif action == 'reject':
            prop.status = 'rejected'
            prop.save()
            return Response({'message': f'"{prop.title}" has been rejected.'})
        return Response({'error': 'Action must be "approve" or "reject".'}, status=400)


class AdminPendingPropertiesView(generics.ListAPIView):
    serializer_class = PropertySerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return Property.objects.filter(status='pending').order_by('-fraud_score')


# ── Saved / Favorites ─────────────────────────────────────────────────────────

class SavedPropertyToggleView(APIView):
    """POST to toggle save/unsave a property."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            prop = Property.objects.get(pk=pk)
        except Property.DoesNotExist:
            return Response({'error': 'Property not found.'}, status=404)

        saved, created = SavedProperty.objects.get_or_create(
            user=request.user, property=prop
        )
        if not created:
            saved.delete()
            return Response({'saved': False, 'message': 'Removed from saved.'})
        return Response({'saved': True, 'message': 'Saved successfully.'}, status=201)


class SavedPropertiesListView(generics.ListAPIView):
    """GET all saved properties for the current user."""
    serializer_class = PropertyListSerializer

    def get_queryset(self):
        return Property.objects.filter(
            saved_by__user=self.request.user
        ).order_by('-saved_by__created_at')