import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Conversation, Message

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time messaging.
    URL: ws://localhost:8000/ws/chat/<conversation_id>/
    """

    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'
        self.user = self.scope['user']

        # Reject unauthenticated connections
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return

        # Verify the user belongs to this conversation
        is_member = await self.is_conversation_member()
        if not is_member:
            await self.close()
            return

        # Join the channel group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """Handle incoming message from WebSocket client."""
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        text = data.get('text', '').strip()
        if not text:
            return

        # Save to DB
        message = await self.save_message(text)
        if not message:
            return

        # Broadcast to all clients in the room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'id': str(message['id']),
                'sender_id': str(self.user.id),
                'sender_name': self.user.full_name,
                'text': text,
                'created_at': message['created_at'],
            }
        )

    async def chat_message(self, event):
        """Forward broadcast message to WebSocket client."""
        await self.send(text_data=json.dumps({
            'id': event['id'],
            'sender_id': event['sender_id'],
            'sender_name': event['sender_name'],
            'text': event['text'],
            'created_at': event['created_at'],
        }))

    # ── DB helpers (run in thread pool) ──────────────────────────────────────

    @database_sync_to_async
    def is_conversation_member(self):
        try:
            conv = Conversation.objects.get(pk=self.conversation_id)
            return conv.tenant == self.user or conv.landlord == self.user
        except Conversation.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, text):
        try:
            conv = Conversation.objects.get(pk=self.conversation_id)
            msg = Message.objects.create(
                conversation=conv,
                sender=self.user,
                text=text,
            )
            conv.save()  # bump updated_at
            return {
                'id': msg.id,
                'created_at': msg.created_at.isoformat(),
            }
        except Conversation.DoesNotExist:
            return None