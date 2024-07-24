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

let playedCardSlots = {

}

let startbutton = document.getElementById("start")

let game_state;
let player = null;
let logged_in = false;
let canVote = false;
let trucoCalled = false;
let threeClowns = false;
let players = {
    "teammate": null,
    "opp1": null,
    "opp2": null
}


        drawUsernames = function () {
            document.getElementById("teamMateUser").innerHTML = players.teammate.username
            document.getElementById("Opponent1User").innerHTML = players.opp1.username
            document.getElementById("Opponent2User").innerHTML = players.opp2.username
        }

        drawPlayedCards = function () {
            document.getElementById("teammateCard").innerHTML = ""
            document.getElementById("opp2Card").innerHTML = ""
            document.getElementById("opp1Card").innerHTML = ""
            document.getElementById("selfCard").innerHTML = ""
            game_state.board.cardsPlayed.forEach(element => {
                if (element.player === players.teammate.username) {
                    cardslot = document.getElementById("teammateCard")
                    cardslot.innerHTML = cardslot.innerHTML + '<img class="cardsmall" src="/static/media/cards/' + element.card.value + element.card.suit + '.jpg" alt="' + element.card.value + element.card.suit + '">'
                }
                else if (element.player === players.opp1.username) {
                    cardslot = document.getElementById("opp1Card")
                    cardslot.innerHTML = cardslot.innerHTML + '<img class="cardsmall" src="/static/media/cards/' + element.card.value + element.card.suit + '.jpg" alt="' + element.card.value + element.card.suit + '">'
                }
                else if (element.player === players.opp2.username) {
                    cardslot = document.getElementById("opp2Card")
                    cardslot.innerHTML = cardslot.innerHTML + '<img class="cardsmall" src="/static/media/cards/' + element.card.value + element.card.suit + '.jpg" alt="' + element.card.value + element.card.suit + '">'
                }
                else if (element.player === player.username){
                    cardslot = document.getElementById("selfCard")
                    cardslot.innerHTML = cardslot.innerHTML + '<img class="cardsmall" src="/static/media/cards/' + element.card.value + element.card.suit + '.jpg" alt="' + element.card.value + element.card.suit + '">'
                }
                
            })
            

        }

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
                cardContain.innerHTML = cardContain.innerHTML + '<button class = "mx-4" id="cardbutton' + index + '" onclick="playCardButton(' + index + ')"> <img class="card" src="/static/media/cards/' + element.value + element.suit + '.jpg" alt="' + element.value + element.suit + '"></button>'
            })
            
        }

        playCardButton = function(index) {
            if (player.hand.length >= index + 1){
                playCard(player.hand[index])
            }
        }

        drawLeftMenu = function() {
            //In this menu the team scores are gonna go here, including points and tricks
            teams = game_state.teams
            yourTeam = teams[player.team]
            otherTeam = teams[(1 - player.team)]
            trickView = ""
            for(let x = 0; x < Math.floor(yourTeam.tricksWon); x++){
                trickView = trickView + "🟢"
            }
            document.getElementById("ourTeam").innerHTML = "Our Team: " + trickView + " - " + yourTeam.points
            trickView = ""
            for(let x = 0; x < Math.floor(otherTeam.tricksWon); x++){
                trickView = trickView + "🟢"
            }
            document.getElementById("theirTeam").innerHTML = "Their Team: " + trickView + " - " + otherTeam.points
        }

        drawRightMenu = function() {
            // In this menu card information, like what trump is is gonna go here
            trumpDict = {
                "A": "Ace's",
                "Q": "Queen's",
                "K": "King's",
                "J": "Jack's",
                "7": "7's",
                "6": "6's",
                "5": "5's",
                "4": "4's",
                "3": "3's",
                "2": "2's"
            }
            board = game_state.board
            trump = board.trump
            trumpText = trumpDict[trump]
            roundWorth = board.pointsWorth
            document.getElementById("pointsWorth").innerHTML = "Round Worth: " + roundWorth
            document.getElementById("trump").innerHTML = "Trump: " + trumpText
        }

        drawBottomMenu = function() {


            draw3ClownsButton = ()=>{
                return "<button onclick='call3Clowns()' class = 'threeClowns'>🤡🤡🤡<br>3 Clowns</button>"
            }
            drawTrucoButton = ()=>{
                return "<button onclick='callTruco()' class='trucoButton'>✋<br>TRUCO</button>"
            }
            whosTurnBox = (username)=>{
                return "<p class='turnBox'>It's " + username + "'s turn</p>"
            }
            trucoOptions = (canRaise = true)=> {
                let fold = "<button onclick='fold()' class='foldButton'>👎<br>FOLD</button>"
                let raise = "<button onclick='raise()' class='raiseButton'>☝️<br>RAISE</button>"
                let play = "<button onclick='play()' class='playButton'>👍<br>PLAY</button>"
                if (canRaise){

                }
                else{
                    raise = ""
                }
                return fold + raise + play
            }

            whatTeam = 0
            playerTurn = ""
            game_state.teams.forEach((element, index) => {
                if (element.calledTruco === true){
                    whatTeam = index
                }
            })
            game_state.players.forEach(element => {
                if (element.isTurn === true){
                    playerTurn = element.username
                }
            })
            if (player.isTurn === true && trucoCalled === false){
                newHTML = drawTrucoButton() //Need to put the truco button, and maybe the 3 clowns button
                if (threeClowns === true){
                    newHTML += draw3ClownsButton()
                }
                document.getElementById("bottomMenu").innerHTML = newHTML
            }
            else if (player.isTurn === true && trucoCalled === true && whatTeam === player.team){
                newHTML = "<p class='turnBox'>Waiting on opponents</p>"  //Put a box saying "waiting on Opponents Call"
                document.getElementById("bottomMenu").innerHTML = newHTML
            }
            else if (player.isTurn === true && trucoCalled === true && whatTeam != player.team){
                newHTML = trucoOptions(game_state.board.pointsWorth < 9) //Put The Truco Options
                document.getElementById("bottomMenu").innerHTML = newHTML
            }
            else if(player.isTurn === false && trucoCalled === false){
                newHTML = whosTurnBox(playerTurn) //Put a box saying whos Turn it is, and maybe a box for 3 clowns
                if (threeClowns === true){
                    newHTML += draw3ClownsButton()
                }
                document.getElementById("bottomMenu").innerHTML = newHTML
            }
            else if(player.isTurn === false && trucoCalled === true && whatTeam === player.team){
                newHTML = "<p class='turnBox'>Waiting on opponents</p>" 
                document.getElementById("bottomMenu").innerHTML = newHTML
            }
            else if(player.isTurn === false && trucoCalled === true && whatTeam != player.team){
                newHTML = trucoOptions(game_state.board.pointsWorth < 9) //Put the truco buttons
                document.getElementById("bottomMenu").innerHTML = newHTML
            }
        }

        drawBoard = function() {
            drawUsernames()
            drawLeftMenu()
            drawRightMenu()
            drawBottomMenu()
            drawPlayedCards()

        }

        updatePlayers = function() {
            index = findPlayer(player)
            player = game_state.players[index]
            newindex = 0
            if (index+1 === game_state.players.length){
                newindex = 0
            }
            else {
                newindex = index + 1
            }
            for (let x = 0; x < game_state.players.length; x++){
                if (x === 0){
                    continue
                }
                else if ( x === 1){
                    players.opp1 = game_state.players[newindex]
                }
                else if (x === 2){
                    players.teammate = game_state.players[newindex]
                }
                else if (x === 3){
                    players.opp2 = game_state.players[newindex]
                }
                if (newindex+1 === game_state.players.length){
                    newindex = 0
                }
                else {
                    newindex = newindex + 1
            }
        }
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
                threeClowns = true
            }
            else {
                threeClowns = false
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
                    drawLobby()
                }
            }
            else if (data.code === "yourplayer"){
                UE.style.visibility = "hidden";
                openLobby()
                player = data.player
                game_state = data.data
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

                // at some point add an dealing animation here, for now I will delay the call.
                trucoCalled = false;
                setTimeout(()=>{
                game_state = data.data
                closeNav()
                updatePlayers()
                drawCards()
                check3Clowns()
                drawBoard()
                
                if (player.isTurn === true){
                    
                    //Write Code to allow the player to take their turn
                }
                else{
                   
                    //Write Code to allow the player to WAIT THEIR TURN
                }
            }, 1000
            )
            }
            else if (data.code === "cardPlayed") {
                trucoCalled = false;
                game_state = data.data
                updatePlayers()
                drawCards()
                check3Clowns()
                drawBoard()
                if (player.isTurn === true){
                    
                    //Write Code to allow the player to take their turn
                }
                else{
                    
                    //Write Code to allow the player to WAIT THEIR TURN
                }
            }

            else if (data.code === "trucoCalled"){
                trucoCalled = true;
                game_state = data.data
                updatePlayers()
                drawCards()
                check3Clowns()
                drawBoard()
                teamCalled = data.team
                if (player.team === teamCalled) {
                    
                }
                else {
                    
                }
            }

            else if (data.code === "trucoAccepted"){
                trucoCalled = false;
                game_state = data.data
                updatePlayers()
                drawCards()
                check3Clowns()
                drawBoard()
            }
            else if (data.code === "trucoFolded"){
                trucoCalled = false;
                game_state = data.data
                updatePlayers()
                drawCards()
                check3Clowns()
                drawBoard()
            }
            else if (data.code === "message") {
                message = data.message
                playerSent = data.player
                document.getElementById("chatBox").innerHTML += "<p>" + playerSent.username + ": " + message + "</p>"
                var messageBody = document.getElementById('chatBox');
                messageBody.scrollTop = messageBody.scrollHeight - messageBody.clientHeight;
            }
            else if (data.code === "error"){
                if (data.error === "invalidusername"){
                    UE.style.visibility = "visible";
                }
                console.log(data.error)
            }
            
            else if (data.code === ""){
        }
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

        document.getElementById('chatSubmit').onclick = function(e) {
            const messageInputDom = document.getElementById("chatInput")
            const message = messageInputDom.value;
            gameSocket.send(JSON.stringify({
                'code': "message",
                'player': player,
                'message': message
            }));
            messageInputDom.value = '';
        };

        
        //This function is what happnes when the start button is pressed. Write code for starting the game here
        document.getElementById('start').onclick = function(e) {
            gameSocket.send(JSON.stringify({
                'code': "start"
            }));
        };

        call3Clowns = function () {

        }

        play = function() {
            gameSocket.send(JSON.stringify({
                'code': "vote",
                "vote": "play",
                "player": player
            }));
        }
        fold = function() {
            gameSocket.send(JSON.stringify({
                'code': "vote",
                "vote": "fold",
                "player": player
            }));
        }
        raise = function() {
            gameSocket.send(JSON.stringify({
                'code': "vote",
                "vote": "raise",
                "player": player
            }));
        }

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