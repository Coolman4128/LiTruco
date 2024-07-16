from django.shortcuts import render, redirect
from games.models import Game
# Create your views here.

def home(request):
    newGame = Game.objects.create()
    return redirect("room", game_name=str(newGame))

def room(request, game_name):
    return render(request, "index.html", {"game_name": game_name})