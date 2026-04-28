from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'phone',
            'role', 'password', 'password2'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    # Use SerializerMethodField instead of ReadOnlyField for model @property
    full_name = serializers.SerializerMethodField()
    is_verified = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'role', 'verification_status', 'is_verified', 'is_email_verified',
            'profile_picture', 'date_joined'
        ]
        read_only_fields = ['id', 'email', 'verification_status', 'date_joined']

    def get_full_name(self, obj):
        return f'{obj.first_name} {obj.last_name}'.strip()

    def get_is_verified(self, obj):
        return obj.verification_status == 'verified'


class UploadIDSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id_document']

    def update(self, instance, validated_data):
        instance.id_document = validated_data.get('id_document', instance.id_document)
        instance.verification_status = 'pending'
        instance.save()
        return instance


class AdminUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = '__all__'
        read_only_fields = ['id', 'date_joined', 'password']

    def get_full_name(self, obj):
        return f'{obj.first_name} {obj.last_name}'.strip()