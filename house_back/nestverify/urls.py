from django.contrib import admin 
from django.urls import path, include 
 
urlpatterns = [ 
    path('admin/', admin.site.urls), 
    path('', include('users.urls')), 
    path('properties/', include('properties.urls')), 
    path('fraud/', include('fraud.urls')), 
    path('chat/', include('chat.urls')), 
    path('viewings/', include('viewings.urls')), 
    path('ai/', include('ai_assistant.urls')), 
] 
