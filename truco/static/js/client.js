const gameName = JSON.parse(document.getElementById('game-name').textContent);

let game_state;
let logged_in = false;

        const gameSocket = new WebSocket(
            'ws://'
            + window.location.host
            + '/ws/play/'
            + gameName
            + '/'
        );


        //This is the function that gets called when a message comes in from the server.
        //Would be smart to make this handle most of the game information coming in from the server.
        gameSocket.onmessage = function(e) {
            const data = JSON.parse(e.data);
            // look for the code to see if game_state is encoded in the message.
            if (data.code === "game_state"){
                game_state = data.data 
            }
            else if (data.code === "newplayer"){
                
            }
            
            console.log(data.data);
        };


        //This is called when a socket closes. Mostly just losing connection to the server.
        gameSocket.onclose = function(e) {
            console.error('Chat socket closed unexpectedly');
        };




        //This function is called when the "username" button is clicked
        // It sends a json object to the server telling it its username
        document.querySelector('#inputButton1').onclick = function(e) {
            const messageInputDom = document.querySelector('#input1');
            const message = messageInputDom.value;
            gameSocket.send(JSON.stringify({
                'code': "username",
                'username': message
            }));
            messageInputDom.value = '';
        };