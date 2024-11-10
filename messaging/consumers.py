import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User
from .models import Message
from asgiref.sync import sync_to_async
import logging

logger = logging.getLogger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            # Get the recipient's user_id from the URL
            self.user_id = self.scope['url_route']['kwargs']['user_id']
            self.room_group_name = f"chat_{self.user_id}"

            # Log the user connection details
            logger.info(f"User {self.scope['user'].username} is connecting to room with user_id: {self.user_id}")

            # Join the WebSocket group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()
            logger.info(f"User {self.scope['user'].username} connected to {self.room_group_name}")

        except Exception as e:
            logger.error(f"Error during connect: {e}")

    async def disconnect(self, close_code):
        try:
            # Remove user from the group when they disconnect
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            logger.info(f"User {self.scope['user'].username} disconnected from {self.room_group_name}")
        except Exception as e:
            logger.error(f"Error during disconnect: {e}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message = data['message']
            sender = self.scope["user"]

            # Get recipient user by user_id
            try:
                recipient = await sync_to_async(User.objects.get)(id=self.user_id)
            except User.DoesNotExist:
                logger.error(f"Recipient with ID {self.user_id} does not exist.")
                return

            # Log the message being sent
            logger.info(f"User {sender.username} sending message to {recipient.username}: {message}")

            # Save the message to the database
            await sync_to_async(Message.objects.create)(
                sender=sender,
                recipient=recipient,
                content=message
            )

            # Send the message to the recipient's room group
            recipient_room_group_name = f"chat_{recipient.id}"

            # Send the message to the recipient's room group
            await self.channel_layer.group_send(
                recipient_room_group_name,  # Send to the correct recipient's group
                {
                    'type': 'chat_message',
                    'message': message,
                    'sender': sender.username,
                }
            )

        except Exception as e:
            logger.error(f"Error during message receive: {e}")

    async def chat_message(self, event):
        message = event['message']
        sender = event['sender']

        # Log the message being received
        logger.info(f"User {self.scope['user'].username} received message from {sender}: {message}")

        # Send the message to the WebSocket client
        await self.send(text_data=json.dumps({
            'message': message,
            'sender': sender,
        }))
