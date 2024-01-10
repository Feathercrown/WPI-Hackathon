window.addEventListener('load', (event) => {
    //Handle canvas and context2D
    var canvas = document.getElementById("main-canvas");
    canvas.width = canvas.getBoundingClientRect().width; //Set internal canvas width/height to match external width/height
    canvas.height = canvas.getBoundingClientRect().height; //EDIT: No longer do this; ensure square external canvas dimensions
    window.addEventListener('resize', ()=>{
        canvas.width = canvas.getBoundingClientRect().width; //Set internal canvas width/height to match external width/height
        canvas.height = canvas.getBoundingClientRect().height; //EDIT: No longer do this; ensure square external canvas dimensions
    });
    var ctx = canvas.getContext("2d");

    //Set up essential variables
    var sprites = [
        {
            image: (()=>{let x=new Image(); x.src='https://www.megachess.com/cdn/shop/products/2017_Mega_Chess_Need_to_Clip-8_d837bf90-4b5c-4fe7-828a-f73ea81d6d5a.png'; return x;})(),
            x: 250,
            y: 250,
            z: 0,
            width: 100,
            height: 100,
        }
    ];
    var selectedSprite = null; //TODO: Track which sprites are selected with an array
    var camera = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        zoom: 1
    };
    var resources = { //TODO: Download resources on join
        rules: './games/Chess/BasicChessRules.pdf'
    };

    //Establish connection with the server
    var socket = new WebSocket('ws://localhost:8081');
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
        } catch(e) {
            console.error(e);
            console.warn("Server %s sent message in string format");
            //TODO: Convert to usable JSON object and continue
        }
    };
    socket.onclose = function(){
        //Socket closed
        console.log("Connection closed");
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
    document.getElementById('submit-chat-button').onclick = function sendChatMessage(){
        var message = document.getElementById('chat-input').value;
        document.getElementById('chat-input').value = '';
        send({
            type: "chat",
            content: message
        });
    };

    /*
    //Handle name changes
    document.getElementById('change-name-button').onclick = function changeName(){
        var name = prompt("Please enter new name:");
        if(name){
            send({
                type: "nameChange",
                newName: name
            });
        }
    };
    */

    //Handle rule-viewing requests
    document.getElementById('view-rules-button').onclick = function showRules(){
        if(resources?.rules){
            window.open(resources.rules, '_blank');
        } else {
            alert("Sorry, no rules document specified.");
        }
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
    console.log("Canvas rendering interval set");
    var drawInterval = setInterval(()=>{
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        /*
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
            //console.log(selectedPiece);
        }
        */

        //TODO: Respect Z-index
        sprites.forEach(sprite => {
            if(sprite === selectedSprite){
                ctx.shadowColor = "blue";
                ctx.shadowBlur = 10;
            }
            ctx.drawImage(
                sprite.image, //image
                (sprite.x - camera.x) * camera.zoom + canvas.width/2, //x
                (sprite.y - camera.y) * camera.zoom + canvas.height/2, //y
                sprite.width * camera.zoom, //width
                sprite.height * camera.zoom //height
            );
            ctx.shadowBlur = 0;
        });
    }, 200); //5 FPS Baby! WOOO thrilling gameplay

    //Handle user input
    canvas.addEventListener('click', (evt)=>{
        let pos = getMousePos(evt);
        console.log(pos);
        let overlappingSprites = sprites.filter(sprite =>
            sprite.x < pos.x &&
            sprite.y < pos.y &&
            (sprite.x + sprite.width) > pos.x &&
            (sprite.y + sprite.height) > pos.y
        );
        if(overlappingSprites.length > 0){
            //TODO: If sprite in overlapping stack selected, select next-behind sprite (wrap to top sprite), to allow cycling between sprites?
            //If sprites were perfectly overlapped, how would you know which one is selected?
            selectedSprite = overlappingSprites.sort((a,b) => (b.z - a.z))[0];
            console.log(selectedSprite);
        } else {
            selectedSprite = null;
        }
        /*
        send({
            type: "gameDecision",
            decision: matches[0]
        });
        */
    });





    //////////////////////
    // Helper Functions //
    //////////////////////

    function getMousePos(event){
        let rect = canvas.getBoundingClientRect();
        let pos = {
            x: ((event.clientX - rect.left) - canvas.width/2) / camera.zoom + camera.x,
            y: ((event.clientY - rect.top) - canvas.height/2) / camera.zoom + camera.y
        };
        return pos;
    }
});
