from django.db import models
from django.conf import settings
import uuid


class Viewing(models.Model):
    STATUS_CHOICES = [
        ('pending',   'Pending'),
        ('accepted',  'Accepted'),
        ('declined',  'Declined'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey(
        'properties.Property', on_delete=models.CASCADE, related_name='viewings'
    )
    tenant = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='viewings'
    )
    scheduled_date = models.DateField()
    scheduled_time = models.TimeField()
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    landlord_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'viewings'
        ordering = ['-scheduled_date', '-scheduled_time']

    def __str__(self):
        return f'{self.tenant.full_name} → {self.listing.title} on {self.scheduled_date}'