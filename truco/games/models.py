from django.db import models
from django.contrib.auth.models import User
from django.core import serializers
from random import randint
# Create your models here.

def generateGameCode():
    n = 8 # How many digits in the game code
    code = ''.join(["{}".format(randint(0, 9)) for num in range(0, n)])
    check = None
    if check == None:
        return code
    else:
        return generateGameCode()

def generateDeck():
    cards = serializers.serialize("json", Card.objects.all())
    data = {"cards": cards}
    return data


def newDeck():
    deck = Deck.objects.create()
    return deck

def newBoard():
    board = Board.objects.create()
    return board

class Game(models.Model):
    id = models.CharField(max_length=8, primary_key=True, default=generateGameCode)
    players = models.JSONField(default=dict, blank=True)
    teams = models.JSONField(default=dict, blank=True)
    board = models.ForeignKey(
        "Board", on_delete=models.CASCADE, default=newBoard
    )
    state = models.CharField(max_length=255, default="lobby")
    def __str__(self):
        return self.id

class Board(models.Model):
    trickNum = models.IntegerField(default=0)
    pointWorth = models.IntegerField(default=1)
    cardsPlayed = models.JSONField(default=dict, blank=True)
    deck = models.ForeignKey("Deck", on_delete=models.CASCADE, default=newDeck)
    trump = models.CharField(max_length=255, null=True, default=None)
    at11 = models.BooleanField(default=False)
    blind = models.BooleanField(default=False)

class Team(models.Model):
    player1 = models.ForeignKey("Player", on_delete=models.SET_NULL, null=True, related_name='player1', default=None)
    player2 = models.ForeignKey("Player", on_delete=models.SET_NULL, null=True, related_name='player2', default=None)
    points = models.IntegerField(default=0)
    tricksWon = models.IntegerField(default=0)
    calledTruco = models.BooleanField(default=False)

class Player(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, default=None)
    username = models.CharField(max_length=255)
    isTurn = models.BooleanField(default=False)
    hand = models.JSONField(default=dict, blank=True)

class Card(models.Model):
    value = models.CharField(max_length=3)
    suit = models.CharField(max_length=20)
    image = models.ImageField(upload_to="cards/")

class Deck(models.Model):
    cards = models.JSONField(default=generateDeck)
    index = models.IntegerField(default=0)