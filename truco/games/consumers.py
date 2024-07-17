import json

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from games.models import Game, Player
from django.core import serializers
import json
import random

group_count = {}

game_states = {}


#SOMETIME SOON REFACTOR ALL GAME LOGIC INTO A SEPERATE FILE TO BE USED HERE
#ALSO SOMETIME SOON ADD CODE TO REJECT USERNAMES THAT ARE NOT ALLOWED: SAME AS SOMEONE ELSE, A DEFUALT VALUE, ETC

class GameConsumer(WebsocketConsumer):
    #This function "seats" players every other team, so that when taking turns we can go down the list
    def interPlayers(self):
        players = game_states[self.game_name]["players"]
        newPlayers0 = []
        newPlayers1 = []
        newPlayers = []
        for player in players:
            if player["team"] == 0:
                newPlayers0 = newPlayers0 + [player]
            if player["team"] == 1:
                newPlayers1 = newPlayers1 + [player]
        while newPlayers0 != [] and newPlayers1 != []:
            newPlayers = newPlayers + [newPlayers0.pop()]
            newPlayers = newPlayers + [newPlayers1.pop()]
        game_states[self.game_name]["players"] = newPlayers

    #This function will deal cards to a player
    def dealPlayerCards(self, player):
        #deal 3 cards, make this one line of code later
        player["hand"] = player["hand"] + [game_states[self.game_name]["board"]["deck"].pop()]
        player["hand"] = player["hand"] + [game_states[self.game_name]["board"]["deck"].pop()]
        player["hand"] = player["hand"] + [game_states[self.game_name]["board"]["deck"].pop()]

    #This function will deal the cards everywhere that needs dealt in preperation for the start of the game.
    def deal(self):
        #This dict shows how to find the trump given a card dealt.
        trumpDict = {
            "4": "5",
            "5": "6",
            "6": "7",
            "7": "Q",
            "Q": "J",
            "J": "K",
            "K": "A",
            "A": "2",
            "2": "3",
            "3": "4"
        }
        for player in game_states[self.game_name]["players"]:
            self.dealPlayerCards(player)
        game_states[self.game_name]["board"]["trump"] = trumpDict[game_states[self.game_name]["board"]["deck"].pop()["value"]]

    # This function will generate a deck of cards to replace on that was used
    def generateDeck(self):
        deck = []
        cardList = ["4", "5", "6", "7", "J", "Q", "K", "A", "2", "3"]
        suitList = ["clubs", "spades", "diamonds", "hearts"]
        for card in cardList:
            for suit in suitList:
                gencard = {"value": card, "suit": suit}
                deck += [gencard]
        return deck


    #This function looks through all the players in the game and finds which one you supplied
    #Returns the index of the player, or -1 if no player is found
    def findPlayer(self, player):
        players = game_states[self.game_name]["players"]
        for x in range(len(players)):
            if player["username"] == players[x]["username"]:
                return x
            else:
                continue
        return -1


    #This function looks through all the players and sees what teams have slots available. 
    def sortTeams(self):
        players = game_states[self.game_name]["players"]
        count0 = 0
        count1 = 0
        for player in players:
            if player["team"] == 0:
                count0 = count0 + 1
            else:
                count1 = count1 + 1
        if count0 < 2:
            self.player["team"] = 0
            return 1
        elif count1 < 2:
            self.player["team"] = 1
            return 1
        else:
            #Game is full, do something here to deal with that
            return -1
            

    # This Function will create a new player, place them on a team and then add them to the game state.
    def createNewPlayer(self, username="AnonymousUser"):
        # This condition is if the user is logged in, so we call pull their username from there
        if (str(self.user) != "AnonymousUser"):
            self.usernameSet = True
            self.username = str(self.user)
            self.player["username"] = self.username
        #This sees if a username parameter was supplied, if it wasnt then return WARNING: Bug when a user puts thier name as "AnonymousUser" add checks for that on serverside code
        elif (username == "AnonymousUser"):
            return
        #This is if a username parameter was supplied by the username input box on the client.
        else:
            self.usernameSet = True
            self.player["username"] = username

        #Call the sort teams method which will find a valid team to place the new player on, or potentially reject them if they are full.
        # returns 1 on success and -1 on failure
        self.sortTeams()

        #Add player to the game state, and then send a socket to the player to identify themself
        #Then send a socket to everyone saying to add them to the list of players
        game_states[self.game_name]["players"] += [self.player]
        print(game_states[self.game_name]["players"])
        self.send(json.dumps({"code": "yourplayer", "player": self.player, "data": game_states[self.game_name]}))
        async_to_sync(self.channel_layer.group_send)(
        self.game_group_name, {"type": "game.newplayer", "code": "newplayer", "player": self.player, "data": game_states[self.game_name]}
        )
        

    def connect(self):
        self.game_name = self.scope["url_route"]["kwargs"]["game_name"]
        self.game_group_name = f"game_{self.game_name}"
        self.user = self.scope["user"]
        self.username = ""
        self.usernameSet = False
        self.player = {
            "username":"Player",
            "isTurn": False,
            "hand": [],
            "team": 0
        }
        #Creates a new game state if one doesn't already exist.
        deck = self.generateDeck()
        game_states[self.game_name] = game_states.get(self.game_name, {
            "players": [],
            "teams": [{
                "points": 0,
                "tricksWon": 0,
                "calledTruco": False
            }, {
                "points": 0,
                "tricksWon": 0,
                "calledTruco": False
            }],
            "board": {
                "trickNum": 0,
                "pointsWorth": 1,
                "cardsPlayed": [],
                "deck": deck,
                "trump": None,
                "at11": False,
                "blind": False,
                "firstTurn": False
            },
            "state": "lobby"
        })
        
        self.accept()

        async_to_sync(self.channel_layer.group_add)(
            self.game_group_name, self.channel_name
        )
        
        # Accept the connection and add one to the socket count for this game
        self.send(json.dumps({"code": "start_state", "data": game_states[self.game_name]}))
        self.createNewPlayer()
        group_count[self.game_group_name] = group_count.get(self.game_group_name, 0) + 1





    #Called when a socket disconnects
    def disconnect(self, close_code):
        # Leave room group
        async_to_sync(self.channel_layer.group_discard)(
            self.game_group_name, self.channel_name
        )
        #Remove one of the connected sockets, IN THE FUTURE put code for removing player from game
        group_count[self.game_group_name] = group_count[self.game_group_name] - 1
        
        #Find the player and remove them from the list
        playerIndex = self.findPlayer(self.player)
        if (playerIndex != -1):
            del game_states[self.game_name]["players"][playerIndex]
            print(game_states[self.game_name]["players"])
        
        #This is here in case a player disconnects without typing in a name
        elif (self.player["username"] == "Player"):
            return

        else:
            print("MAJOR ISSUE")

        #This code will send out a message to all the other players saying that this guy disconnected
        async_to_sync(self.channel_layer.group_send)(
        self.game_group_name, {"type": "game.newplayer", "code": "playerleft", "player": self.player, "data": game_states[self.game_name]}
        )


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
            self.createNewPlayer(username=text_data_json["username"])
        
        #This code will be called when a player sends the "start" command telling the server the player is ready to start the game
        elif (code == "start"):
            currentState = game_states[self.game_name]

            #In this if put all the conditions that could stop the game from starting 
            if len(currentState["players"]) < 4:
                async_to_sync(self.channel_layer.group_send)(
                self.game_group_name, {"type": "game.message", "code": "message", "data": "Conditions not met to start game"}
                )

            else:
                #This code prepares for the start of the game. First it sits the players every other
                #Then it shuffles the deck, and deals the cards
                #Then it makes the first player go first, and sets the game state to "roundstart"
                self.interPlayers()
                random.shuffle(game_states[self.game_name]["board"]["deck"])
                self.deal()
                game_states[self.game_name]["players"][0]["isTurn"] = True
                game_states[self.game_name]["state"] = "roundStart"
                async_to_sync(self.channel_layer.group_send)(
                self.game_group_name, {"type": "game.sendState", "code": "start", "data": game_states[self.game_name]}
             )
        
        elif (code == "swap"):
            index = self.findPlayer(text_data_json["player"])
            game_states[self.game_name]["players"][index] = text_data_json["player"]
            async_to_sync(self.channel_layer.group_send)(
            self.game_group_name, {"type": "game.newplayer", "code": "swap", "player": text_data_json["player"], "data": game_states[self.game_name]}
            )

        else:
            pass



    # This sends a message back to all the sockets connected
    #Should be used by the server to tell the sockets how it responds
    #To the socket that it recieved.
    def game_message(self, event):
        code = event["code"]
        message = event["message"]
        # Send message to WebSocket using the send method. Every socket in the group heard this event so it sends it to everyone, but send itself only sends to one client.
        self.send(text_data=json.dumps({"code": code, "data": message}))


    def game_newplayer(self, event):
        code = event["code"]
        player = event["player"]
        data = event["data"]
        # Send message to WebSocket using the send method. Every socket in the group heard this event so it sends it to everyone, but send itself only sends to one client.
        self.send(text_data=json.dumps({"code": code, "player":player,"data":data}))

    def game_sendState(self, event):
        code = event["code"]
        data = event["data"]
        # Send message to WebSocket using the send method. Every socket in the group heard this event so it sends it to everyone, but send itself only sends to one client.
        self.send(text_data=json.dumps({"code": code, "data":data}))