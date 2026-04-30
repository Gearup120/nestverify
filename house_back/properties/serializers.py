import json
import cloudinary
from rest_framework import serializers
from .models import Property, PropertyImage
from users.serializers import UserProfileSerializer


class PropertyImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = PropertyImage
        fields = ['id', 'image', 'is_primary', 'uploaded_at']

    def get_image(self, obj):
        # Return the full Cloudinary URL
        if obj.image:
            return cloudinary.CloudinaryImage(str(obj.image)).build_url()
        return None


class PropertySerializer(serializers.ModelSerializer):
    images = PropertyImageSerializer(many=True, read_only=True)
    owner = UserProfileSerializer(read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )

    class Meta:
        model = Property
        fields = [
            'id', 'owner', 'title', 'description', 'property_type',
            'price', 'address', 'city', 'state', 'country',
            'bedrooms', 'bathrooms', 'area_sqm', 'latitude', 'longitude', 'amenities',
            'status', 'fraud_score', 'fraud_flags', 'is_verified',
            'views_count', 'images', 'uploaded_images',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'owner', 'status', 'fraud_score', 'fraud_flags',
            'is_verified', 'views_count', 'created_at', 'updated_at'
        ]

    def to_internal_value(self, data):
        # Handle MultiValueDict (form-data)
        if hasattr(data, 'getlist'):
            plain = {}
            for key in data.keys():
                if key == 'uploaded_images':
                    plain[key] = data.getlist(key)
                else:
                    values = data.getlist(key)
                    plain[key] = values if len(values) > 1 else values[0]
            data = plain

        # Handle amenities parsing
        amenities_raw = data.get('amenities', [])
        if isinstance(amenities_raw, str):
            if not amenities_raw.strip():
                data['amenities'] = []
            else:
                try:
                    # Try JSON first
                    parsed = json.loads(amenities_raw)
                    data['amenities'] = parsed if isinstance(parsed, list) else [str(parsed)]
                except (json.JSONDecodeError, ValueError):
                    # Fallback to comma-separated
                    data['amenities'] = [a.strip() for a in amenities_raw.split(',') if a.strip()]
        
        if 'amenities' not in data or data['amenities'] is None:
            data['amenities'] = []

        return super().to_internal_value(data)

    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        property_obj = Property.objects.create(**validated_data)
        for i, img in enumerate(uploaded_images):
            PropertyImage.objects.create(
                property=property_obj,
                image=img,
                is_primary=(i == 0)
            )
        return property_obj


class PropertyListSerializer(serializers.ModelSerializer):
    primary_image = serializers.SerializerMethodField()
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)

    class Meta:
        model = Property
        fields = [
            'id', 'title', 'property_type', 'price', 'city', 'state',
            'bedrooms', 'bathrooms', 'status', 'is_verified',
            'latitude', 'longitude',
            'fraud_score', 'primary_image', 'owner_name', 'created_at'
        ]

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img and img.image:
            return cloudinary.CloudinaryImage(str(img.image)).build_url()
        return None