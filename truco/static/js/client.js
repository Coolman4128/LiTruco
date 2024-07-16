const gameName = JSON.parse(document.getElementById('game-name').textContent);

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
            console.log(data);
            document.querySelector('#chat-log').value += (data.message + '\n');
        };


        //This is called when a socket closes. Mostly just losing connection to the server.
        gameSocket.onclose = function(e) {
            console.error('Chat socket closed unexpectedly');
        };

        document.querySelector('#chat-message-input').focus();
        document.querySelector('#chat-message-input').onkeyup = function(e) {
            if (e.key === 'Enter') {  // enter, return
                document.querySelector('#chat-message-submit').click();
            }
        };


        //This function is called when the "send" button is clicked. Use this as a reference for when you impliment other parts of the game.
        document.querySelector('#chat-message-submit').onclick = function(e) {
            const messageInputDom = document.querySelector('#chat-message-input');
            const message = messageInputDom.value;
            gameSocket.send(JSON.stringify({
                'message': message
            }));
            messageInputDom.value = '';
        };