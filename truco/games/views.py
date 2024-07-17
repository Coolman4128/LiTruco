from django.shortcuts import render, redirect, get_object_or_404
from games.models import Game
# Create your views here.

def home(request):
    newGame = Game.objects.create()
    return redirect("room", game_name=str(newGame))

def room(request, game_name):
    game = get_object_or_404(Game, id=game_name)
    return render(request, "index.html", {"game_name": game_name})