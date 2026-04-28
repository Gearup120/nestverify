from django.db import models
from django.conf import settings
import uuid


class Conversation(models.Model):
    """A thread between a tenant and a landlord about a specific property."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Renamed from 'property' to 'listing' — 'property' conflicts with Python's @property decorator
    listing = models.ForeignKey(
        'properties.Property', on_delete=models.CASCADE, related_name='conversations'
    )
    tenant = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tenant_conversations'
    )
    landlord = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='landlord_conversations'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'conversations'
        ordering = ['-updated_at']
        unique_together = ['listing', 'tenant']

    def __str__(self):
        return f'{self.tenant} ↔ {self.landlord} re: {self.listing.title}'

    @property
    def last_message(self):
        return self.messages.order_by('-created_at').first()

    @property
    def unread_count_for(self):
        return self.messages.filter(is_read=False).count()


class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages'
    )
    text = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'messages'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.sender.first_name}: {self.text[:50]}'