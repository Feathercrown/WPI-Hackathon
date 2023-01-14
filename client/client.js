window.addEventListener('load', (event) => {
    var canvas = document.getElementById("main-canvas");
    canvas.width = canvas.getBoundingClientRect().width; //Set internal canvas width/height to match external width/height
    canvas.height = canvas.getBoundingClientRect().height;
    var ctx = canvas.getContext("2d");
    ctx.fillRect(5,5,10,10);

    var socket = new WebSocket('ws://localhost:8080');
    socket.onopen = function(){
        //Socket opened
        socket.send('{"data":"test"}');
    };
    socket.onmessage = function(msg){
        //Message recieved
        try {
            console.log(msg);
            var msgData = JSON.parse(msg.data); //TODO: Do anything else with the message object besides strip it down to its data?
            receive(msgData, this);
        } catch(e){
            console.error(e);
            console.warn("Server %s sent message in string format");
            //TODO: Convert to usable JSON object and continue
        }
    };
    socket.onclose = function(){
        //Socket closed
    };

    //TODO: Custom socket send and receive functions to handle JSON serialization/parsing, error handling, displaying stuff, etc.
    function send(msg){
        socket.send(JSON.stringify(msg));
    }

    function receive(msg){
        console.log(msg.type);
        switch(msg.type){
            case 'chat':
                console.log(msg.content);
                var chatMessage = document.createElement('div');
                chatMessage.appendChild(document.createTextNode(msg.sender+": "+msg.content)); //TODO: This is a major security flaw, you can totally just send a script tag and it'll get sent to every other user and run on their clients lmao
                document.getElementById('chat-output').appendChild(chatMessage);
                break;
            default:
                break;
        }
    }

    document.getElementById('chat-submit').onclick = function sendChatMessage(){
        var message = document.getElementById('chat-input').value;
        document.getElementById('chat-input').value = '';
        send({
            type: "chat",
            content: message //TODO: Currently, sending chat messages with emoji crashes/closes the Websocket :(
        });
    };
});
