from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from .models import Message
from django.contrib.auth.models import User


def get_messages(request, user_id):
    other_user = User.objects.get(id=user_id)
    messages = Message.objects.filter(
        sender=request.user, recipient=other_user
    ) | Message.objects.filter(
        sender=other_user, recipient=request.user
    ).order_by("timestamp")
    
    messages_data = [{"sender": msg.sender.username, "content": msg.content, "timestamp": msg.timestamp} for msg in messages]
    return JsonResponse({"messages": messages_data})

def list_users(request):
    users = User.objects.exclude(id=request.user.id).exclude(is_superuser=True)
    
    # Prepare user data with all fields
    users_data = [
        {
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "is_superuser": user.is_superuser,
            "date_joined": user.date_joined,
        }
        for user in users
    ]
    return JsonResponse({"users": users_data})
