const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { isUint8ClampedArray } = require("util/types");
const e = require("express");

const app = express();
const PORT = 3000 || process.env.PORT;
const server = http.createServer(app);


function shuffleArray(array) { 
  return array.sort( ()=>Math.random()-0.5 );
} 

class Game {
  constructor(id, isPriavte = false, ) {
    this.id = id;
    this.players = [];
    this.isPriavte = isPriavte;
    this.teams = ["A", "B"];
    this.deck = [
      [1, 1], [1, 2], [1, 3], [1, 4],
      [2, 1], [2, 2], [2, 3], [2, 4],
      [3, 1], [3, 2], [3, 3], [3, 4],
      [4, 1], [4, 2], [4, 3], [4, 4],
      [5, 1], [5, 2], [5, 3], [5, 4],
      [6, 1], [6, 2], [6, 3], [6, 4],
      [7, 1], [7, 2], [7, 3], [7, 4],
      [10, 1], [10, 2], [10, 3], [10, 4],
      [11, 1], [11, 2], [11, 3], [11, 4],
      [12, 1], [12, 2], [12, 3], [12, 4]
    ];
    this.discard = [];
    this.trump = -1;
    this.closed = false;
    this.pointValue = 0;
    this.teamTrucoed = "N";
    this.curTrick = [];
    this.isPlaying = false;
    this.turn = 0;
  }
}


// Set static folder
app.use(express.static("public"));

// Socket setup
const io = socket(server);

// Players array
let users = [];
let games = [];

io.on("connection", (socket) => {
  console.log("Made socket connection", socket.id);


  socket.on("getRandomGame", (callback) => {
    let found = 0;
    console.log(games.length + " games");
    if (games.length === 0) {
      let newGame = new Game(games.length);
      console.log(games.length + " no games created");
      games.push(newGame);
      callback(newGame);
    }
    else {
    for(let game of games){
      if (game.players.length < 4) {
        callback(game);
        found = 1;
      }
      else {
        game.closed = true;
      }
    }
    if (found === 0) {
      let newGame = new Game(games.length);
      console.log(games.length + " couldnt find a game");
        games.push(newGame);
        callback(newGame);
    }
  }
  });

  socket.on("getGame", (id, callback) => {
    gameFound = games.find(game => game.id === id);
    if (gameFound) {
      callback(gameFound);
    }
    else {
      callback("Game not found");
    }
  });

  socket.on("join", (data, playergameID) => {
    users.push(data);
    games.find(game => game.id === playergameID).players.push(data);
    socket.join(playergameID);
    io.sockets.to(playergameID).emit("join", data);
  });

  socket.on("needID", (callback) => {
    callback(users.length + 1);
  });


  socket.on('startGame', (idGame) => {
    currentGame = games.find(game => game.id === idGame);
    currentGame.isPlaying = true;
    currentGame.discard = [];
    currentGame.players = shuffleArray(currentGame.players);
    if (currentGame.players.find(player => player.teamID !== "N")) {
      firstPlayer = currentGame.players.find(player => player.teamID !== "N");
      secondPlayer = currentGame.players.find(player => player.teamID === firstPlayer.teamID && player.id !== firstPlayer.id);
      thirdPlayer = currentGame.players.find( player => player.id !== firstPlayer.id && player.id !== secondPlayer.id);
      fourthPlayer = currentGame.players.find( player => player.id !== firstPlayer.id && player.id !== secondPlayer.id && player.id !== thirdPlayer.id);
      currentGame.players[0] = firstPlayer;
      currentGame.players[0].teamID = "A";
      currentGame.players[1] = secondPlayer;
      currentGame.players[1].teamID = "B";
      currentGame.players[2] = thirdPlayer;
      currentGame.players[2].teamID = "A";
      currentGame.players[3] = fourthPlayer;
      currentGame.players[3].teamID = "B";
    }
    else {
      currentGame.players[0].teamID = "A";
      currentGame.players[1].teamID = "B";
      currentGame.players[2].teamID = "A";
      currentGame.players[3].teamID = "B";
    }
    currentGame.players[0].isTurn = true;
    currentGame.deck = shuffleArray(currentGame.deck);
    currentGame.players.forEach((player, index) => {
    player.hand.push(currentGame.deck.shift());
    player.hand.push(currentGame.deck.shift());
    player.hand.push(currentGame.deck.shift());
    });
    currentGame.trump = currentGame.deck.shift();
    io.sockets.to(idGame).emit("startGame", currentGame);
  });

  socket.on('newRound', (idGame) => {
    currentGame = games.find(game => game.id === idGame);
    currentGame.deck.push(currentGame.trump.shift());
    currentGame.deck = current.deck.concat(currentGame.discard);
    currentGame.discard = [];
    currentGame.deck = shuffleArray(currentGame.deck);
    currentGame.players.forEach((player, index) => {
    player.hand.push(currentGame.deck.shift());
    player.hand.push(currentGame.deck.shift());
    player.hand.push(currentGame.deck.shift());
    currentGame.trump = currentGame.deck.shift();
    io.sockets.to(idGame).emit("newRound", currentGame);
    });
  });

  socket.on('updateGame', (idGame, data) => {
    currentGame = games.find(game => game.id === idGame);
    currentGame = data;
    io.sockets.to(idGame).emit("updateGame", currentGame);
  });


  socket.on("restart", () => {
    users = [];
    io.sockets.emit("restart");
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
