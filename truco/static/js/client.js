const gameName = JSON.parse(document.getElementById('game-name').textContent);

let T1 = document.getElementById("T1")
let T2 = document.getElementById("T2")

let C1 = document.getElementById("card1p")
let C2 = document.getElementById("card2p")
let C3 = document.getElementById("card3p")

let TRUMP = document.getElementById("trump")
let T1P = document.getElementById("T1P")
let T2P = document.getElementById("T2P")
let T1T = document.getElementById("T1T")
let T2T = document.getElementById("T2T")
let YT = document.getElementById("yourTurn")
let CP = document.getElementById("cardsPlayed")

let UE = document.getElementById("userError")
let TO = document.getElementById("trucoOptions")
let PB = document.getElementById("playButtons")
let THREEC = document.getElementById("button1")

const lobbySlots = [T1, T2]
const cardSlots = [C1, C2, C3]
const boardSlots = {
    "trump": TRUMP,
    "t1p": T1P,
    "t2p": T2P,
    "t1t": T1T,
    "t2t": T2T,
    "yt": YT,
    "cp": CP
}


let startbutton = document.getElementById("start")

let game_state;
let player = null;
let logged_in = false;
let canVote = false;

        callTruco = function(){
            if (player.isTurn === false){
                return "notTurn"
            }
            else if (game_state.teams[player.team].calledTruco === true){
                return "alreadyCalled"
            }
            else if (game_state.board.pointsWorth === 12){
                return "alreadyWorth12"
            }
            gameSocket.send(JSON.stringify({
                'code': "callTruco",
                'player': player
            }));
        }

        //This Function is supplied a card and will attempt to play it
        playCard = function(card){
            if (player.isTurn === false){
                return "notTurn"
            }
            gameSocket.send(JSON.stringify({
                'code': "playCard",
                'player': player,
                'card': card
            }));
        }

        //This function will draw cards to the screen
        drawCards = function(){
            cardContain = document.getElementById("cardSlotContainer")
            cardContain.innerHTML = ""
            player.hand.forEach((element, index)=> {
                cardContain.innerHTML = cardContain.innerHTML + '<button id="cardbutton' + index + '" onclick="playCardButton(' + index + ')"> <img class="card" src="/static/media/cards/' + element.value + element.suit + '.jpg" alt="' + element.value + element.suit + '"></button>'
            })
            
        }

        playCardButton = function(index) {
            if (player.hand.length >= index + 1){
                playCard(player.hand[index])
            }
        }

        drawBoard = function() {
            teams = game_state.teams
            board = game_state.board
            boardSlots.trump.innerHTML = board.trump
            boardSlots.t1p.innerHTML = teams["0"].points
            boardSlots.t2p.innerHTML = teams["1"].points
            boardSlots.t1t.innerHTML = teams["0"].tricksWon
            boardSlots.t2t.innerHTML = teams["1"].tricksWon
            boardSlots.yt.innerHTML = player.isTurn
            boardSlots.cp.innerHTML = ""
            board.cardsPlayed.forEach(element =>{
                boardSlots.cp.innerHTML = boardSlots.cp.innerHTML + ", " + element.card.value + "|" + element.card.suit
            })

        }

        updatePlayer = function(){
            index = findPlayer(player)
            player = game_state.players[index]
        }

        drawLobby = function(){
            lobbySlots.forEach(element => {
                element.innerHTML = ""
            })
            game_state.players.forEach(element => {
                if (element.team === 0){
                    T1.innerHTML = T1.innerHTML + element.username + "\n"
                }
                else if (element.team === 1){
                    T2.innerHTML = T2.innerHTML + element.username + "\n"
                }
            })
        }

        checkforStart = function() {
            // Write code here that checks if there are an equal number of players per team, and any other requirements
            let team1Count = 0;
            let team2Count = 0;
            game_state.players.forEach(element => {
                if (element.team === 0){
                    team1Count = team1Count + 1;
                }
                else {
                    team2Count = team2Count + 1;
                }
            })
            if (team1Count === team2Count && game_state.players.length > 3){
                startbutton.style.backgroundColor = "#8b0000";
                return true;
            }
            else {
                startbutton.style.backgroundColor = "#818181";
                return false
            }
        };

        const gameSocket = new WebSocket(
            'ws://'
            + window.location.host
            + '/ws/play/'
            + gameName
            + '/'
        );

        findPlayer = function(player) {
            let finIndex = -1;
            game_state.players.forEach((element, index) => {
                if (player.username == element.username){
                    finIndex = index
                }
                else{   
                }
            });
            return finIndex;
        };

        check3Clowns = function() {
            if (game_state.board.firstTurn === true && (game_state.teams["0"].calledTruco === false && game_state.teams["1"].calledTruco === false)) {
                THREEC.style.visibility = "visible"
            }
            else {
                THREEC.style.visibility = "hidden"
            }
        }

        //This is the function that gets called when a message comes in from the server.
        //Would be smart to make this handle most of the game information coming in from the server.
        gameSocket.onmessage = function(e) {
            const data = JSON.parse(e.data);
            // look for the code to see if game_state is encoded in the message.
            if (data.code === "start_state"){
                closeLobby()
                game_state = data.data 
                if (game_state.state === "lobby"){
                    game_state.players.forEach((element) => {
                        drawLobby()
                    })
                }
            }
            else if (data.code === "yourplayer"){
                UE.style.visibility = "hidden";
                openLobby()
                player = data.player
                game_state = data.data
                console.log(player)
                closeUsername()
            }
            else if (data.code === "newplayer"){
                newplayer = data.player
                team = newplayer.team
                game_state = data.data
                drawLobby()
                checkforStart()
            }
            else if (data.code === "playerleftLobby"){
                playerleft = data.player
                game_state = data.data
                drawLobby()
                checkforStart()
            }
            else if (data.code === "swap"){
                game_state = data.data
                drawLobby()
                checkforStart()  
            }
            else if (data.code === "start"){
                game_state = data.data
                closeNav()
                updatePlayer()
                drawCards()
                drawBoard()
                check3Clowns()
                console.log(player)
                if (player.isTurn === true){
                    PB.style.visibility = "visible";
                    //Write Code to allow the player to take their turn
                }
                else{
                    PB.style.visibility = "hidden";
                    //Write Code to allow the player to WAIT THEIR TURN
                }
            }
            else if (data.code === "cardPlayed") {
                game_state = data.data
                TO.style.visibility = "hidden";
                updatePlayer()
                drawCards()
                drawBoard()
                check3Clowns()
                if (player.isTurn === true){
                    PB.style.visibility = "visible";
                    //Write Code to allow the player to take their turn
                }
                else{
                    PB.style.visibility = "hidden";
                    //Write Code to allow the player to WAIT THEIR TURN
                }
            }

            else if (data.code === "trucoCalled"){
                game_state = data.data
                updatePlayer()
                check3Clowns()
                teamCalled = data.team
                if (player.team === teamCalled) {
                    TO.style.visibility = "hidden";
                }
                else {
                    TO.style.visibility = "visible";
                }
            }

            else if (data.code === "trucoAccepted"){
                game_state = data.data
                TO.style.visibility = "hidden";
                updatePlayer()
                drawCards()
                drawBoard()
                check3Clowns()
            }
            else if (data.code === "trucoFolded"){
                game_state = data.data
                TO.style.visibility = "hidden";
                updatePlayer()
                drawCards()
                drawBoard()
                check3Clowns()
            }
            else if (data.code === "error"){
                if (data.error === "invalidusername"){
                    UE.style.visibility = "visible";
                }
            }
            
            else if (data.code === "")
            
            console.log(data.data);
        };


        //This is called when a socket closes. Mostly just losing connection to the server.
        gameSocket.onclose = function(e) {
            console.error('Chat socket closed unexpectedly');
        };




        //This function is called when the "username" button is clicked
        // It sends a json object to the server telling it its username
        document.getElementById('inputButton1').onclick = function(e) {
            const messageInputDom = document.getElementById("input1")
            const message = messageInputDom.value;
            gameSocket.send(JSON.stringify({
                'code': "username",
                'username': message
            }));
            messageInputDom.value = '';
        };

        
        //This function is what happnes when the start button is pressed. Write code for starting the game here
        document.getElementById('start').onclick = function(e) {
            gameSocket.send(JSON.stringify({
                'code': "start"
            }));
        };

        //document.getElementById('fold').onclick = function(e) {
            //gameSocket.send(JSON.stringify({
                //'code': "vote",
                //"vote": "fold",
                //"player": player
            //}));
        //};

        //document.getElementById('play').onclick = function(e) {
            //gameSocket.send(JSON.stringify({
                //'code': "vote",
                //"vote": "play",
                //"player": player
            //}));
        //};

        function openNav() {
            document.getElementById("overlayMenu").style.display = "block";
          }
          
          function closeNav() {
            document.getElementById("overlayMenu").style.display = "none";
          }

          function openLobby() {
            document.getElementById("lobbyMenu").style.display = "block";
          }
          
          function closeLobby() {
            document.getElementById("lobbyMenu").style.display = "none";
          }

          function closeUsername() {
            document.getElementById("username-popup").style.display = "none";
          }

        //document.getElementById('raise').onclick = function(e) {
            //gameSocket.send(JSON.stringify({
                //'code': "vote",
                //"vote": "raise",
                //"player": player
           // }));
        //};

        /*
        document.getElementById('button3').onclick = function(e) {
            if (player.hand.length >= 1){
                playCard(player.hand["0"])
            }
        };
        document.getElementById('button4').onclick = function(e) {
            if (player.hand.length >= 2){
                playCard(player.hand["1"])
            }
        };
        document.getElementById('button5').onclick = function(e) {
            if (player.hand.length >= 3){
                playCard(player.hand["2"])
            }
        };

        document.getElementById('button1').onclick = function(e) {
            if (player.hand.length >= 3){
                playCard(player.hand["2"])
            }
        };

        document.getElementById('button2').onclick = function(e) {
            callTruco()
        };
        */


        //This function is what happnes when the swap button is pressed. Write code for swapping teams here
        document.getElementById('teamSwap').onclick = function(e) {
            if (player === null){
                return;
            }
            if (player.team === 0){
                player.team = 1
            }
            else {
                player.team = 0
            }
            gameSocket.send(JSON.stringify({
                'code': "swap",
                'player': player
            }));
        };