from django.shortcuts import render,redirect
from django.contrib.auth.models import User,auth
from django.contrib import messages
from django.contrib.auth import logout as auth_logout
from django.contrib.auth import views as auth_views

from django.contrib.auth.decorators import login_required

# Ensure the user is logged in before accessing the chat
def chat_user(request):
    if not request.user.is_authenticated:
        return redirect('/')  # Redirect to login page if the user is not authenticated
    return render(request, 'chat.html',{'user': request.user})

def index(request):
    return render(request,"home.html")

def login(request):
    if request.method =='POST':
        username=request.POST['username']
        password=request.POST['password']

        user=auth.authenticate(username=username,password=password)

        if user is not None:
            auth.login(request,user)
            return redirect("chat")
        else:
            messages.error(request,"invalid credential", extra_tags='login')
            return render(request, 'home.html')

    else:
        return render(request,'home.html')


# Create your views here.
def register(request):
    if request.method == 'POST':
        first_name=request.POST['first_name']
        last_name=request.POST['last_name']
        username=request.POST['username']
        password1=request.POST['password1']
        password2=request.POST['password2']
        email=request.POST['email']

        if len(password1)>=8:
            if password1==password2:
                if User.objects.filter(username=username).exists():
                    messages.error(request,"Username already exists.", extra_tags='signup')
                    return redirect('/')
                elif User.objects.filter(email=email).exists():
                    messages.error(request,"Email already exists.", extra_tags='signup')
                    return redirect('/')

                else:
                    user=User.objects.create_user(username=username,password=password1,email=email,first_name=first_name,last_name=last_name)
                    user.save()    
                    print("user created")
                    messages.success(request,"user created, please login.", extra_tags='signup')
                    return redirect('/')

            else:
                messages.error(request,"password not matched", extra_tags='signup')
                return render(request, 'home.html')
        else:
            messages.error(request,"password is too short it must be 8 character long", extra_tags='signup')
            return render(request, 'home.html')
        return redirect('/')
    else:
        return render(request,'home.html')

def user_logout(request):
    messages.get_messages(request).used = True  
    auth_logout(request)  # Log out the user using the Django auth_logout function
    messages.success(request, "Logout successfully!", extra_tags='logout')  # Add a success message
    return redirect('/')