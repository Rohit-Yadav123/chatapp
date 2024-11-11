import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Message
from django.contrib.auth.models import User
from asgiref.sync import sync_to_async

# Initialize logger
logger = logging.getLogger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            # Get the recipient's user_id from the URL and cast it to an integer
            self.recipient_user_id = int(self.scope['url_route']['kwargs']['user_id'])  # Cast to int
            sender_user_id = int(self.scope["user"].id)

            # Ensure the room group name is unique by sorting the user IDs
            self.room_group_name = self.get_unique_room_name(sender_user_id, self.recipient_user_id)

            # Log the user connection details
            logger.info(f"User {self.scope['user'].username} is connecting to room: {self.room_group_name}")

            # Join the WebSocket group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()
            logger.info(f"User {self.scope['user'].username} connected to {self.room_group_name}")

        except Exception as e:
            logger.error(f"Error during connect: {e}")
            # Fallback in case connect fails, so we don't get an attribute error later
            self.room_group_name = None

    async def disconnect(self, close_code):
        try:
            # Check if room_group_name exists before trying to discard the group
            if hasattr(self, 'room_group_name') and self.room_group_name:
                # Remove user from the group when they disconnect
                await self.channel_layer.group_discard(
                    self.room_group_name,
                    self.channel_name
                )
                logger.info(f"User {self.scope['user'].username} disconnected from {self.room_group_name}")
            else:
                logger.warning("Room group name is not set, skipping group discard.")

        except Exception as e:
            logger.error(f"Error during disconnect: {e}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message = data['message']
            sender = self.scope["user"]

            # Get recipient user by user_id and cast recipient_user_id to integer
            try:
                recipient = await sync_to_async(User.objects.get)(id=self.recipient_user_id)
            except User.DoesNotExist:
                logger.error(f"Recipient with ID {self.recipient_user_id} does not exist.")
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
            recipient_room_group_name = self.get_unique_room_name(sender.id, recipient.id)

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

    def get_unique_room_name(self, user_id_1, user_id_2):
        """Generate a unique room name for two users by sorting their IDs."""
        return f"chat_{min(user_id_1, user_id_2)}_{max(user_id_1, user_id_2)}"
