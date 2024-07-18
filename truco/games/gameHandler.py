

#This Class will store a "Game" which includes all the information that makes up a game
#but also the functions used to make the game progress and run
class GameHandler():
    def __init__(self, game_name):
        self.game_name = game_name
        deck = self.generateDeck()
        self.game_state = {
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
        }

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
    
    #This function looks through all the players and sees what teams have slots available. 
    #Returns the Team that player should join
    def sortTeams(self):
        players = self.game_state["players"]
        count0 = 0
        count1 = 0
        for player in players:
            if player["team"] == 0:
                count0 = count0 + 1
            else:
                count1 = count1 + 1
        if count0 < 2:
            return 0
        elif count1 < 2:
            return 1
        else:
            #Game is full, do something here to deal with that
            return -1


    #This function looks through all the players in the game and finds which one you supplied
    #Returns the index of the player, or -1 if no player is found
    def findPlayer(self, player):
        players = self.game_state["players"]
        for x in range(len(players)):
            if player["username"] == players[x]["username"]:
                return x
            else:
                continue
        return -1

    #This function "seats" players every other team, so that when taking turns we can go down the list
    def interPlayers(self):
        players = self.game_state["players"]
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
        self.game_state["players"] = newPlayers

    #This function will deal cards to a player
    def dealPlayerCards(self, player):
        #deal 3 cards, make this one line of code later
        player["hand"] = player["hand"] + [self.game_state["board"]["deck"].pop()]
        player["hand"] = player["hand"] + [self.game_state["board"]["deck"].pop()]
        player["hand"] = player["hand"] + [self.game_state["board"]["deck"].pop()]

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
        for player in self.game_state["players"]:
            self.dealPlayerCards(player)
        self.game_state["board"]["trump"] = trumpDict[self.game_state["board"]["deck"].pop()["value"]]


