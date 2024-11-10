# task/asgi.py

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from messaging import routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'task.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),  # HTTP requests will be handled by Django's default application
    "websocket": AuthMiddlewareStack(
        URLRouter(
            routing.websocket_urlpatterns  # WebSocket routing from the messaging app
        )
    ),
})
