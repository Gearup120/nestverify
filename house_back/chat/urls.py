from django.urls import path
from . import views

urlpatterns = [
    path('conversations/', views.ConversationListView.as_view(), name='conversations'),
    path('conversations/start/', views.StartConversationView.as_view(), name='start-conversation'),
    path('conversations/<uuid:pk>/', views.ConversationDetailView.as_view(), name='conversation-detail'),
    path('conversations/<uuid:conversation_id>/messages/', views.MessageListView.as_view(), name='messages'),
    path('conversations/<uuid:conversation_id>/send/', views.SendMessageView.as_view(), name='send-message'),
    path('unread/', views.UnreadCountView.as_view(), name='unread-count'),
]