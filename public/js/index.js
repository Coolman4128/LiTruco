// Making Connection
const socket = io.connect("http://localhost:3000");
let localPlayerID;
socket.emit("needID", (response) => {
  console.log(response);
  localPlayerID = response; 
});

let localPlayer; // Player object for individual players
let currentGame;


let canvas = document.getElementById("canvas");
canvas.width = document.documentElement.clientHeight * 0.9;
canvas.height = document.documentElement.clientHeight * 0.9;
let ctx = canvas.getContext("2d");


const side = canvas.width / 10;
const offsetX = side / 2;
const offsetY = side / 2 + 20;


class Player {
  constructor(id, username, isTurn = false, hand = [], teamID = null) {
    this.id = id;
    this.username = username;
    this.hand = hand;
    this.isTurn = isTurn;
    this.teamID = teamID;
  }

}

function drawCards(player) {
  height = canvas.height - 100;
  ctx.fillStyle = "black";
  ctx.font = "30px Arial";
  if (player.hand.length === 3) {
    player.hand.forEach((card, index) => {
      ctx.fillText(card[0], (canvas.width / 2) - 20 * (1 - index), height);
    });
  }
  else if (player.hand.length === 2) {
    player.hand.forEach((card, index) => {
      if (index === 0) {
      ctx.fillText(card[0], (canvas.width / 2) - 10, height);
      }
      else {
        ctx.fillText(card[0], (canvas.width / 2) + 10, height);
      }
    });
  }
  else{
    player.hand.forEach((card, index) => {
      ctx.fillText(card[0], (canvas.width / 2), height);
    });
  }
 
}

function drawTrump() {
  ctx.fillStyle = "black";
  ctx.font = "30px Arial";
  ctx.fillText(currentGame.trump[0], canvas.width /2, canvas.height/2);
  
}

function drawTurnButtons() {
  width = canvas.width - 200;
  height = canvas.height - 200;
  ctx.fillStyle = "black";
  ctx.font = "30px Arial";
  ctx.fillText("Truco", width, height);
}

function drawThreeClowns() {
  width = canvas.width - 200;
  height = canvas.height - 200;
  ctx.fillStyle = "black";
  ctx.font = "30px Arial";
  ctx.fillText("Three Clowns", width, height + 50);
}

function drawCharacters(){
  ctx.fillStyle = "black";
  ctx.font = "30px Arial";
  counter = 0;
  teammate = currentGame.players.find(player => player.teamID === localPlayer.teamID && player.id !== localPlayerID);
  ctx.fillText(teammate.username, canvas.width/2, canvas.height-(canvas.height-20));
  currentGame.players.forEach((player, index) => {
    if (player.id !== localPlayerID && player.id !== teammate.id) {
      if (counter === 0) {
        ctx.fillText(player.username, canvas.width - 40, canvas.height/2);
        counter++;
      }
      else {
        ctx.fillText(player.username, canvas.width - (canvas.width - 40), canvas.height/2);
      }
    }
  });
  }
  


function getMousePosition(canvas, event) {
  let rect = canvas.getBoundingClientRect();
  let x = event.clientX - rect.left;
  let y = event.clientY - rect.top;
  console.log("Coordinate x: " + x,
      "Coordinate y: " + y);
  return [x, y];
}

document.getElementById("start-btn").addEventListener("click", () => {
  let gamePromise = new Promise((resolve, reject) => {
  const gameID = document.getElementById("gameId").value;
  if (gameID === "") {
    console.log("No game ID");
    socket.emit("getRandomGame", (response) => {
      currentGame = response;
    });
  }
  else {
    socket.emit("getGame", gameID, (response) => {
      if (response === "Game not found") {
        socket.emit("getRandomGame", (response) => {
          currentGame = response;
        });
      }
      else{
        console.log("foudn Game!");
      currentGame = response;
      }
    });
  }
  if (currentGame) {
    resolve(currentGame);
  }
  else {
    setTimeout(() => {
      if (currentGame) {
        resolve(currentGame);
      }
      else {
        reject("Game not found");
      }
    }, 250);
  }
});
gamePromise.then((response) => {
  const name = document.getElementById("name").value;
  document.getElementById("idDisplay").innerHTML = '<h3>' + currentGame.id + '</h3>';
  document.getElementById("name").disabled = true;
  document.getElementById("gameId").disabled = true;
  localPlayer = new Player(localPlayerID, name, false, [], "N");
  currentGame.players.forEach((player, index) => {
    document.getElementById(
      "players-table"
    ).innerHTML += `<tr><td>${player.username + player.id}</td></tr>`;
  });
  socket.emit("join", localPlayer, currentGame.id);
  
},
(reject) => {
  console.log(reject);
});
});

document.getElementById("start-button").addEventListener("click", () => {
  socket.emit("startGame", currentGame.id);
});




// Listen for events

canvas.addEventListener("mousedown", function (e) {
  getMousePosition(canvas, e);
});


socket.on("join", (data) => {
  currentGame.players.push(new Player(data.id, data.username, data.isTurn, data.hand, data.teamID));
  document.getElementById(
    "players-table"
  ).innerHTML += `<tr><td>${data.username + data.id}</td></tr>`;
  console.log(currentGame.players.length);
  if (currentGame.players.length === 4) {
    document.getElementById("start-button").hidden = false;
    document.getElementById("start-btn").hidden = true;
  }
});

socket.on('startGame', (Game) => {
  document.getElementById("idDisplay").hidden = true;
  document.getElementById("infoBoxID").hidden = true;
  document.getElementById("gameid").hidden = true;
  document.getElementById("start-button").hidden = true;
  currentGame = Game;
  localPlayer = currentGame.players.find(player => player.id === localPlayerID);
  drawCards(localPlayer);
  drawTrump();
  drawThreeClowns();
  drawCharacters();
  if (localPlayer.isTurn) {
    drawTurnButtons();
  }
  else {
    
    //find active player and highlight them
  }
});

// Logic to restart the game
document.getElementById("restart-btn").addEventListener("click", () => {
  socket.emit("restart");
});

socket.on("restart", () => {
  window.location.reload();
});
