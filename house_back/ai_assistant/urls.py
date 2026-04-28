from django.urls import path
from . import views

urlpatterns = [
    path('chat/', views.AIAssistantView.as_view(), name='ai-chat'),
]