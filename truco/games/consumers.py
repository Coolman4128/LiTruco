import json

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from games.models import Game, Player
from django.core import serializers
import json

group_count = {}

class GameConsumer(WebsocketConsumer):
    #Called when new socket connects. We should get them in the room, if there is spots, then configure their position.
    def connect(self):
        self.game_name = self.scope["url_route"]["kwargs"]["game_name"]
        self.game_group_name = f"game_{self.game_name}"
        
        # Put code here for checking how many slots are left, adding a player to the game, putting them in a team etc etc.


        currentGame = Game.objects.get(id=self.game_name)
        players = len(currentGame.players)
        print(players)








        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.game_group_name, self.channel_name
        )
        # Accept the connection and add one to the socket count for this game
        self.accept()
        group_count[self.game_group_name] = group_count.get(self.game_group_name, 0) + 1

    #Called when a socket disconnects
    def disconnect(self, close_code):
        # Leave room group
        async_to_sync(self.channel_layer.group_discard)(
            self.game_group_name, self.channel_name
        )

        #Remove one of the connected sockets, IN THE FUTURE put code for removing player from game
        group_count[self.game_group_name] = group_count[self.game_group_name] - 1
        
        #If there are no connected Sockets then delete the game
        if(group_count[self.game_group_name] == 0):
            deadGame = Game.objects.get(id=self.game_name)
            deadGame.delete()
            del group_count[self.game_name]
        

    # This is called when a message from a websocket is recieved from the server. This is where
    # Handling players moves and things like that should happen
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]

        #This line sends an event to everyone in the same group as the current socket
        #This particular event is called chat.message which gets converted to chat_message
        #It also has the "message" atribute where we store the message recieved
        async_to_sync(self.channel_layer.group_send)(
            self.game_group_name, {"type": "game.message", "message": message}
        )

    # This sends a message back to all the sockets connected
    #Should be used by the server to tell the sockets how it responds
    #To the socket that it recieved.
    def game_message(self, event):
        message = event["message"]
        # Send message to WebSocket using the send method. Every socket in the group heard this event so it sends it to everyone, but send itself only sends to one client.
        self.send(text_data=json.dumps({"message": message}))