from django.contrib import admin
from .models import FraudReport


@admin.register(FraudReport)
class FraudReportAdmin(admin.ModelAdmin):
    list_display = ['property', 'reported_by', 'status', 'auto_generated', 'created_at']
    list_filter = ['status', 'auto_generated']
    search_fields = ['property__title', 'reason']
    readonly_fields = ['created_at', 'auto_generated']
