from rest_framework import serializers
from .models import Conversation, Message
from users.serializers import UserProfileSerializer


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)
    sender_id = serializers.CharField(source='sender.id', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'sender_id', 'sender_name', 'text', 'is_read', 'created_at']
        read_only_fields = ['id', 'sender_id', 'sender_name', 'is_read', 'created_at']


class ConversationSerializer(serializers.ModelSerializer):
    tenant = UserProfileSerializer(read_only=True)
    landlord = UserProfileSerializer(read_only=True)
    # Use 'listing' field name now
    property_title = serializers.CharField(source='listing.title', read_only=True)
    property_id = serializers.CharField(source='listing.id', read_only=True)
    last_message_text = serializers.SerializerMethodField()
    last_message_time = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'property_id', 'property_title',
            'tenant', 'landlord',
            'last_message_text', 'last_message_time',
            'unread_count', 'created_at', 'updated_at',
        ]

    def get_last_message_text(self, obj):
        msg = obj.messages.order_by('-created_at').first()
        return msg.text[:80] if msg else None

    def get_last_message_time(self, obj):
        msg = obj.messages.order_by('-created_at').first()
        return msg.created_at if msg else obj.created_at

    def get_unread_count(self, obj):
        user = self.context['request'].user
        return obj.messages.filter(is_read=False).exclude(sender=user).count()