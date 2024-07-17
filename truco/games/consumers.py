import json

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from games.models import Game, Player
from django.core import serializers
import json

group_count = {}

game_states = {}

class GameConsumer(WebsocketConsumer):
    #Called when new socket connects. We should get them in the room, if there is spots, then configure their position.
    def connect(self):
        self.game_name = self.scope["url_route"]["kwargs"]["game_name"]
        self.game_group_name = f"game_{self.game_name}"
        self.user = self.scope["user"]
        self.username = ""
        self.usernameSet = False
        self.player = {
            "username":"Player",
            "isTurn": False,
            "hand": []
        }

        #Creates a new game state if one doesn't already exist.
        game_states[self.game_name] = game_states.get(self.game_name, {
            "players": [],
            "teams": [{
                "player1": {},
                "player2": {},
                "points": 0,
                "tricksWon": 0,
                "calledTruco": False
            }, {
                "player1": {},
                "player2": {},
                "points": 0,
                "tricksWon": 0,
                "calledTruco": False
            }],
            "board": {
                "trickNum": 0,
                "pointsWorth": 1,
                "cardsPlayed": [],
                "deck": [],
                "trump": None,
                "at11": False,
                "blind": False,
                "firstTurn": False
            },
            "state": "lobby"
        })

        print(game_states)

        if (str(self.user) != "AnonymousUser"):
            self.usernameSet = True
            self.username = str(self.user)
            self.player["username"] = self.username
            game_states[self.game_name]["players"] += [self.player]
            async_to_sync(self.channel_layer.group_send)(
            self.game_group_name, {"type": "game.newplayer", "code": "newplayer", "player": self.player, "data": game_states[self.game_name]}
        )
        
        # Put code here for checking how many slots are left.
        if (len(game_states[self.game_name]["players"]) > 4):
            #potentially do something, if we allow spectators then don't
            pass

       

        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.game_group_name, self.channel_name
        )
        # Accept the connection and add one to the socket count for this game
        self.accept()
        self.send(json.dumps({"code": "game_state", "data": game_states[self.game_name]}))
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
            #This needs work that I will do later, currently causes the game to be deleted on a reload
            #deadGame.delete()
            #del group_count[self.game_name]
        

    # This is called when a message from a websocket is recieved from the server. This is where
    # Handling players moves and things like that should happen
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        code = text_data_json["code"]

        #This is where we will interpret the clients code that they sent and decide what to do with it.
        #For example, if it is "username" then we will set the persons username and make a player.
        #If it is "message" then we can further look into the message details, etc etc.
        if (code == "username"):
            #This is where we will create a player using the username, and potentially place them on a team/allow them to spectate.
            self.player["username"] = text_data_json["username"]
            game_states[self.game_name]["players"] += [self.player]
            async_to_sync(self.channel_layer.group_send)(
            self.game_group_name, {"type": "game.newplayer", "code": "newplayer", "player": self.player, "data": game_states[self.game_name]}
        )

        elif (code == "message"):
            pass
        else:
            pass


        #This line sends an event to everyone in the same group as the current socket
        #This particular event is called chat.message which gets converted to chat_message
        #It also has the "message" atribute where we store the message recieved
        async_to_sync(self.channel_layer.group_send)(
            self.game_group_name, {"type": "game.message", "message": code}
        )

    # This sends a message back to all the sockets connected
    #Should be used by the server to tell the sockets how it responds
    #To the socket that it recieved.
    def game_message(self, event):
        message = event["message"]
        # Send message to WebSocket using the send method. Every socket in the group heard this event so it sends it to everyone, but send itself only sends to one client.
        self.send(text_data=json.dumps({"message": message}))


    def game_newplayer(self, event):
        code = event["code"]
        player = event["player"]
        data = event["data"]
        # Send message to WebSocket using the send method. Every socket in the group heard this event so it sends it to everyone, but send itself only sends to one client.
        self.send(text_data=json.dumps({"code": code, "player":player,"data":data}))