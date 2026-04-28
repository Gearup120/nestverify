from django.contrib import admin
from .models import Viewing

@admin.register(Viewing)
class ViewingAdmin(admin.ModelAdmin):
    list_display = ['listing', 'tenant', 'scheduled_date', 'scheduled_time', 'status']
    list_filter = ['status']