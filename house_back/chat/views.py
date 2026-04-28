from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from properties.models import Property


class ConversationListView(generics.ListAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(
            Q(tenant=user) | Q(landlord=user)
        ).prefetch_related('messages').select_related('tenant', 'landlord', 'listing')

    def get_serializer_context(self):
        return {'request': self.request}


class StartConversationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        property_id = request.data.get('property_id')
        if not property_id:
            return Response({'error': 'property_id is required.'}, status=400)

        try:
            prop = Property.objects.get(pk=property_id)
        except Property.DoesNotExist:
            return Response({'error': 'Property not found.'}, status=404)

        if prop.owner == request.user:
            return Response({'error': 'You cannot chat with yourself.'}, status=400)

        conversation, created = Conversation.objects.get_or_create(
            listing=prop,
            tenant=request.user,
            defaults={'landlord': prop.owner}
        )

        serializer = ConversationSerializer(conversation, context={'request': request})
        return Response(serializer.data, status=201 if created else 200)


class ConversationDetailView(generics.RetrieveAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(Q(tenant=user) | Q(landlord=user))

    def get_serializer_context(self):
        return {'request': self.request}


class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        conv_id = self.kwargs['conversation_id']
        try:
            conv = Conversation.objects.get(pk=conv_id)
            if conv.tenant != user and conv.landlord != user:
                return Message.objects.none()
        except Conversation.DoesNotExist:
            return Message.objects.none()

        conv.messages.exclude(sender=user).update(is_read=True)
        return conv.messages.all()


class SendMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, conversation_id):
        user = request.user
        text = request.data.get('text', '').strip()
        if not text:
            return Response({'error': 'Message text is required.'}, status=400)

        try:
            conv = Conversation.objects.get(pk=conversation_id)
        except Conversation.DoesNotExist:
            return Response({'error': 'Conversation not found.'}, status=404)

        if conv.tenant != user and conv.landlord != user:
            return Response({'error': 'Permission denied.'}, status=403)

        message = Message.objects.create(conversation=conv, sender=user, text=text)
        conv.save()
        return Response(MessageSerializer(message).data, status=201)


class UnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        count = Message.objects.filter(
            conversation__in=Conversation.objects.filter(
                Q(tenant=user) | Q(landlord=user)
            )
        ).exclude(sender=user).filter(is_read=False).count()
        return Response({'unread': count})