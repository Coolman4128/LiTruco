from django.contrib import admin
from games.models import Game, Card, Board, Deck, Player, Team
# Register your models here.
admin.site.register(Game)
admin.site.register(Card)
admin.site.register(Board)
admin.site.register(Deck)
admin.site.register(Player)
admin.site.register(Team)