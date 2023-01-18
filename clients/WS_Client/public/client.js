window.addEventListener('load', (event) => {
    var canvas = document.getElementById("main-canvas");
    canvas.width = canvas.getBoundingClientRect().width; //Set internal canvas width/height to match external width/height
    canvas.height = canvas.getBoundingClientRect().height; //EDIT: No longer do this; ensure square external canvas dimensions
    window.addEventListener('resize', ()=>{
        canvas.width = canvas.getBoundingClientRect().width; //Set internal canvas width/height to match external width/height
        canvas.height = canvas.getBoundingClientRect().height; //EDIT: No longer do this; ensure square external canvas dimensions
    });
    var ctx = canvas.getContext("2d");
    ctx.fillRect(5,5,10,10);
    var sprites = [];
    var decisions = [];
    var selectedPiece;
    var tileWidth = 60;

    var socket = new WebSocket('ws://localhost:8080');
    socket.onopen = function(){
        //Socket opened
        console.log("Connection established");
        //socket.send('{"type":"connectionEstablished"}');
        socket.send(JSON.stringify({
            type: "gameJoin",
            gameUUID: new URLSearchParams(window.location.search).get('game')
        }));
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
                chatMessage.appendChild(document.createTextNode(msg.sender+": "+msg.content));
                document.getElementById('chat-output').appendChild(chatMessage);
                break;
            case 'gameStateUpdate':
                sprites = msg.newState.sprites;
                sprites.forEach(sprite=>{
                    sprite.image = new Image();
                    console.log(sprite.src);
                    sprite.image.src = sprite.src;
                });
                break;
            case 'decisionList':
                decisions = msg.list;
                break;
            default:
                break;
        }
    }



    //Assign event handlers

    //Handle chat submission
    document.getElementById('chat-submit-button').onclick = function sendChatMessage(){
        var message = document.getElementById('chat-input').value;
        document.getElementById('chat-input').value = '';
        send({
            type: "chat",
            content: message //TODO: Currently, sending chat messages with emoji crashes/closes the Websocket :(
        });
    };

    //Handle leaving the game and unloading the page
    function leaveGame(){
        send({
            type: "gameLeave",
            gameUUID: new URLSearchParams(window.location.search).get('game') //Clients can only be in one game so this is unnecessary but send it just in case
        });
        window.location = "./index.html";
    }
    document.getElementById('leave-game-button').onclick = ()=>{
        if(confirm("Are you sure you want to leave the game?")){
            leaveGame();
        }
    };
    window.addEventListener('beforeunload', (event)=>{ //TODO: Not working :despair:
        event.preventDefault();
        event.returnValue = 'onbeforeunload';
        return false;
    });
    window.addEventListener('pagehide', leaveGame);

    //Draw canvas
    console.log("Drawing interval set");
    var drawInterval = setInterval(()=>{
        //console.log("Drawing interval run");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        console.log(decisions);
        if(selectedPiece){
            var matches = decisions.filter(decision=>{
                return decision.piece[0] == selectedPiece.x && decision.piece[1] == selectedPiece.y;
            });
            matches.forEach(match=>{
                //console.log(match);
                if(match.type=="move" || match.type=="doubleStep"){
                    ctx.fillStyle = "#FFFF00";
                    ctx.fillRect(match.args[0][0]*tileWidth, 7*tileWidth - match.args[0][1]*tileWidth, tileWidth, tileWidth);
                } else if(match.type=="capture" || match.type=="enPassent"){
                    ctx.fillStyle = "#FF0000";
                    ctx.fillRect(match.args[0][0]*tileWidth, 7*tileWidth - match.args[0][1]*tileWidth, tileWidth, tileWidth);
                }
            });
            console.log(selectedPiece);
        }
        sprites.forEach(sprite=>{
            ctx.drawImage(sprite.image, sprite.x, sprite.y, sprite.width, sprite.height);
        });
    }, 200); //5 FPS Baby! WOOO thrilling gameplay

    //Handle user input
    canvas.addEventListener('click', (evt)=>{
        var rect = canvas.getBoundingClientRect();
        var pos = {
            x: Math.floor((evt.clientX - rect.left)/tileWidth),
            y: 7 - Math.floor((evt.clientY - rect.top)/tileWidth)
        };
        if(selectedPiece){
            var matches = decisions.filter(decision=>{
                return decision.piece[0] == selectedPiece.x && decision.piece[1] == selectedPiece.y
                && decision.args[0][0] == pos.x && decision.args[0][1] == pos.y;
            });
            console.log(matches);
            if(matches.length == 1){
                send({
                    type: "gameDecision",
                    decision: matches[0]
                });
            }
        }
        selectedPiece = pos;
    });
});
