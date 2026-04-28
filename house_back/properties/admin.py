from django.contrib import admin
from .models import Property, PropertyImage


class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 0
    readonly_fields = ['uploaded_at']


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ['title', 'owner', 'city', 'price', 'status', 'fraud_score', 'is_verified', 'created_at']
    list_filter = ['status', 'is_verified', 'property_type', 'city']
    search_fields = ['title', 'address', 'owner__email']
    ordering = ['-fraud_score', '-created_at']
    readonly_fields = ['fraud_score', 'fraud_flags', 'views_count', 'created_at', 'updated_at']
    inlines = [PropertyImageInline]

    actions = ['approve_properties', 'reject_properties']

    def approve_properties(self, request, queryset):
        queryset.update(status='approved', is_verified=True)
        self.message_user(request, f'{queryset.count()} properties approved.')
    approve_properties.short_description = 'Approve selected properties'

    def reject_properties(self, request, queryset):
        queryset.update(status='rejected')
        self.message_user(request, f'{queryset.count()} properties rejected.')
    reject_properties.short_description = 'Reject selected properties'
