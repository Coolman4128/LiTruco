from django.shortcuts import render

# Create your views here.

def home(request):
    return render(request, "index.html")

def room(request, game_name):
    return render(request, "index.html", {"game_name": game_name})