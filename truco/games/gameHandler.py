import random
import yaml
import math

#This Class will store a "Game" which includes all the information that makes up a game
#but also the functions used to make the game progress and run
class GameHandler():
    def __init__(self, game_name):
        self.game_name = game_name
        deck = self.generateDeck()
        self.trucoVote = []
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
                "firstTurn": False,
                "firstTrick": False,
                "whosDeal": 0
            },
            "state": "lobby"
        }

    def increasePointValue(self):
        if self.game_state["board"]["pointsWorth"] == 1:
            self.game_state["board"]["pointsWorth"] = 3
        else:
            self.game_state["board"]["pointsWorth"] = self.game_state["board"]["pointsWorth"] + 3

    def handleTruco(self, code):
        if code == "fold":
            teamWon = 0
            if (self.game_state["teams"][0]["calledTruco"] == True):
                self.round
            self.roundOver()
        elif code == "play":
            self.increasePointValue()
            self.game_state["state"] = "inPlay"
        elif code == "raise":
            if (self.game_state["board"]["pointsWorth"] == 9):
                return
            else:
                self.increasePointValue()
            

    def trucoCalled(self, player):
        team = self.game_state["teams"][player["team"]]
        team["calledTruco"] = True
        if (player["team"] == 0):
            self.game_state["teams"][1]["calledTruco"] = False
        else:
             self.game_state["teams"][0]["calledTruco"] = False
        self.game_state["state"] = "truco"

    def awardPoints(self, winner = "default"):
        winningTeam = None
        if (winner == "default"):
            if (self.game_state["teams"][0]["tricksWon"] > self.game_state["teams"][1]["tricksWon"]):
                winningTeam = self.game_state["teams"][0]
            elif (self.game_state["teams"][0]["tricksWon"] == self.game_state["teams"][1]["tricksWon"]):
                #Put code to deal wiht a complete tie here
                pass
            else:
                winningTeam = self.game_state["teams"][1]
        else:
            winningTeam = winner
        winningTeam["points"] = winningTeam["points"] + self.game_state["board"]["pointsWorth"]

    def initGame(self):
        self.game_state["teams"][0]["tricksWon"] = 0
        self.game_state["teams"][1]["tricksWon"] = 0
        self.game_state["teams"][0]["calledTruco"] = False
        self.game_state["teams"][1]["calledTruco"] = False
        self.game_state["board"]["trickNum"] = 0
        self.game_state["board"]["pointsWorth"] = 1
        self.game_state["state"] = "inPlay"
        self.game_state["board"]["firstTurn"] = True
        self.game_state["board"]["firstTrick"] = True
        self.game_state["board"]["deck"] = self.generateDeck()
        random.shuffle(self.game_state["board"]["deck"])

        if(self.game_state["teams"][0]["points"] == 11 and self.game_state["teams"][1]["points"] == 11):
            self.game_state["board"]["blind"] = True 
        else:
            self.game_state["board"]["blind"] = False

        if (self.game_state["teams"][0]["points"] == 11 or self.game_state["teams"][1]["points"] == 11):
            self.game_state["board"]["at11"] = True 
        else:
            self.game_state["board"]["at11"] = False

        if (self.game_state["board"]["whosDeal"] == len(self.game_state["players"]) - 1):
            self.game_state["board"]["whosDeal"] = 0
        else:
            self.game_state["board"]["whosDeal"] = self.game_state["board"]["whosDeal"] + 1
        
        for x in range(len(self.game_state["players"])):
            if x == self.game_state["board"]["whosDeal"]:
                self.game_state["players"][x]["isTurn"] = True  
            else:
                self.game_state["players"][x]["isTurn"] = False 

        if (self.game_state["board"]["at11"] == True and self.game_state["board"]["blind"] == False):
            self.game_state["teams"][0]["calledTruco"] = True
            self.game_state["teams"][1]["calledTruco"] = True
            self.game_state["state"] = "11roundStart"
        elif (self.game_state["board"]["at11"] == True and self.game_state["board"]["blind"] == True):
            self.game_state["teams"][0]["calledTruco"] = True
            self.game_state["teams"][1]["calledTruco"] = True
            self.game_state["state"] = "blindStart"
        

    #This function handles what will happen when a round is over, it awards points and then sets up for the next round
    def roundOver(self, winner = "default"):
        self.game_state["board"]["cardsPlayed"] = []
        self.trucoVote = []
        self.awardPoints(winner = winner)
        self.initGame()
        if (self.game_state["teams"][0]["points"] >= 12 or self.game_state["teams"][1]["points"] >= 12):
            return "gameOver"
        
        if (self.game_state["state"] == "blindStart"):
            self.deal()
            return "blindStart"
        elif (self.game_state["state"] == "11roundStart"):
            self.deal()
            return "11Round"
        else:
            self.deal()
            return "normal"
                    

    #This function will handle the end of a trick, including weather to start a new round, start a new trick, etc
    def trickOver(self):
        winner, tie = self.calculateWinner()
        winner = self.findPlayer({"username": winner})
        winner = self.game_state["players"][winner]
        if tie == True:
            if (math.floor(self.game_state["teams"][0]["tricksWon"]) == 0 and math.floor(self.game_state["teams"][1]["tricksWon"]) == 0):
                self.game_state["board"]["trickNum"] = 1
                # There is a bug where the game derails on 3 ties in a row, fix that soon
            else:
                self.game_state["board"]["trickNum"] = 3
        else:
            winningTeam = winner["team"]
            if (self.game_state["board"]["firstTrick"]):
                self.game_state["teams"][winningTeam]["tricksWon"] = self.game_state["teams"][winningTeam]["tricksWon"] + 1.1
            else:
                self.game_state["teams"][winningTeam]["tricksWon"] = self.game_state["teams"][winningTeam]["tricksWon"] + 1
        self.game_state["board"]["cardsPlayed"] = []
        self.game_state["board"]["trickNum"] = self.game_state["board"]["trickNum"] + 1

        for player in self.game_state["players"]:
            if (player["username"] == winner["username"]):
                player["isTurn"] = True
            else:
                player["isTurn"] = False
        self.game_state["board"]["firstTrick"] = False
        if (self.game_state["board"]["trickNum"] >= 3 or self.game_state["teams"][0]["tricksWon"] >= 2 or self.game_state["teams"][1]["tricksWon"] >= 2):
            self.roundOver()

    #Function to calculate the winner, needs a refactor but should work for now
    #Returns the player with the winning card
    def calculateWinner(self):
        cardValueDict = {
            "4": 1,
            "5": 2,
            "6": 3,
            "7": 4,
            "Q": 5,
            "J": 6,
            "K": 7,
            "A": 8,
            "2": 9,
            "3": 10,
            "TD": 11,
            "TS": 12,
            "TH": 13,
            "TC": 14
        }
        currentWinner = None
        tie = False
        for play in self.game_state["board"]["cardsPlayed"]:
            if currentWinner == None:
                currentWinner = play
                continue
            if (play["card"]["value"] == self.game_state["board"]["trump"] and currentWinner["card"]["value"] == self.game_state["board"]["trump"]):
                cardValue = "TD"
                currentWinnerValue = "TD"
                if (play["card"]["suit"] == "diamonds"):
                    pass
                elif (play["card"]["suit"] == "spades"):
                    cardValue = "TS"
                elif (play["card"]["suit"] == "hearts"):
                    cardValue = "TH"
                elif (play["card"]["suit"] == "clubs"):
                    cardValue = "TC"

                if (currentWinner["card"]["suit"] == "diamonds"):
                    pass
                elif (currentWinner["card"]["suit"] == "spades"):
                    currentWinnerValue = "TS"
                elif (currentWinner["card"]["suit"] == "hearts"):
                    currentWinnerValue = "TH"
                elif (currentWinner["card"]["suit"] == "clubs"):
                    currentWinnerValue = "TC"
                
                if (cardValueDict[cardValue] > cardValueDict[currentWinnerValue]):
                    tie = False
                    currentWinner = play
                

            elif (play["card"]["value"] == self.game_state["board"]["trump"]):
                cardValue = "TD"
                if (play["card"]["suit"] == "diamonds"):
                    pass
                elif (play["card"]["suit"] == "spades"):
                    cardValue = "TS"
                elif (play["card"]["suit"] == "hearts"):
                    cardValue = "TH"
                elif (play["card"]["suit"] == "clubs"):
                    cardValue = "TC"
                if (cardValueDict[cardValue] > cardValueDict[currentWinner["card"]["value"]]):
                    tie = False
                    currentWinner = play
            
            elif (currentWinner["card"]["value"] == self.game_state["board"]["trump"]):
                continue

            else:
                if (cardValueDict[play["card"]["value"]] > cardValueDict[currentWinner["card"]["value"]]):
                    currentWinner = play
                    tie = False
                elif (cardValueDict[play["card"]["value"]] == cardValueDict[currentWinner["card"]["value"]]):
                    playIndex = self.findPlayer({"username": play["player"]})
                    currentIndex = self.findPlayer({"username": currentWinner["player"]})
                    if (self.game_state["players"][playIndex]["team"] == self.game_state["players"][currentIndex]["team"] ):
                        pass
                    else:
                        tie = True
        if (tie):
            return currentWinner["player"], tie
        else:
            return currentWinner["player"], tie

    def printGameState(self):
        print(yaml.dump(self.game_state, allow_unicode=True, default_flow_style=False))

    #This function will do everything needed to go from the lobby to the start of the game
    def startGame(self):
        self.interPlayers()
        random.shuffle(self.game_state["board"]["deck"])
        self.deal()
        self.game_state["players"][0]["isTurn"] = True
        self.game_state["state"] = "inPlay"
        self.game_state["board"]["firstTurn"] = True
        self.game_state["board"]["firstTrick"] = True

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
        player["hand"] = []
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


