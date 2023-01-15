const server = {};
server.config = require('../config.json');
const generateUUID = require('uuid').v4;
const ws = require('ws');
server.wss = new ws.WebSocketServer({ port: server.config.websocketPort });
const express = require('express');
var bodyParser = require('body-parser');
const path = require('path/posix');
server.app = express();
const WS_Client = require('./WS_Client.js').WS_Client;
const randName = require("random-anonymous-animals");
const Game = require('./Game.js').Game;
server.clients = new Map();
server.games = new Map();

//TODO: Make a proper game creation service
for(var i=0; i<9; i++){
    var gameUUID = generateUUID();
    server.games.set(gameUUID, new Game(gameUUID, "Elemental Chess #"+(i+1), [], server));
}

//Express Server
server.app.get('/', (req, res, next) => {
    var options = {
        root: path.join(__dirname, '../public'),
        dotfiles: 'deny',
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true
        }
    };
    res.sendFile('/index.html', options, function (err) {
        if (err) {
            console.error('Failed to send homepage');
            next(err);
        } else {
            console.log(`Sent homepage`);
        }
    });
})

server.app.use(express.static('public'));

//REST API
server.app.use(bodyParser.urlencoded({ extended: true }));
server.app.get('/api/games', (req, res) => {
    res.send(Array.from(server.games).map(game=>{
        var gameInfo = { //Don't send the entire server object over as part of each game
            uuid: game[1].uuid, //each "game" is a [uuid,Game] pair
            name: game[1].name,
            players: game[1].players //TODO: clients or users?
        }
        return gameInfo;
    }));
}); //Send in array format to make parsing easier on the frontend, since Maps can't be sent through JSON (afaik)

//Start Express Server
server.app.listen(server.config.expressPort, () => {
    console.log(`Example app listening at http://localhost:${server.config.expressPort}`);
});



//Websocket Server
server.wss.on('connection', function connection(ws, req) {
    var clientUUID = generateUUID();
    var client = new WS_Client(clientUUID, randName(clientUUID), ws, server);
    server.clients.set(client.uuid, client);
    console.log("New connection with UUID %s", client.uuid);
});

server.wss.on('close', function close() {
    console.log('Websocket server closed');
});

/*server.wss.on("message", function message(h){
  console.log("h: "+h);
});*/

server.receive = function (msg, client) {
    console.log('Client %s sent message: %o', client.uuid, msg);
    switch (msg.type) {
        case "login": //Can a client switch users while playing a game? Are games tied to clients or users? Clients, because you can be userless (a guest)?
            //Log in or error
            break;
        case "logout":
            //Log out
            break;
        case "chat":
            server.clients.forEach((targetClient) => {
                targetClient.send({
                    type: "chat",
                    sender: client.user.name,
                    content: msg.content
                });
            });
            break;
        case "gameDecision":
            //TODO
            break;
        case "":
            console.error("Error: Client %s sent message with no type", client.uuid);
            break;
        default:
            console.error("Error: Client %s sent message with unrecognized type", client.uuid);
            break;
    }
};

server.send = function (msg, client) {
    client.send(msg);
};