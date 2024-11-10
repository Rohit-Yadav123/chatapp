from django.urls import path
from . import views

urlpatterns = [
    path("api/messages/<int:user_id>/", views.get_messages, name="get_messages"),
    path("api/users/", views.list_users, name="list_users"),
]
