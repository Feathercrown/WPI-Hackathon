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
const Game = require('../games/Game.js').Game;
server.clients = new Map();
server.games = new Map();
server.gameTypes = new Map();

//Load all games specified in the config; TODO: Load every game in the "games" folder
var gamesToLoad = server.config.permanentGames.filter((el, idx, arr)=>{
    return arr.slice(idx+1).indexOf(el) == -1; //Only keep one (the last) copy of each game file name
});
gamesToLoad.forEach(gameName=>server.gameTypes.set(gameName, require(`../games/${gameName}.js`))); //This is unholy
server.config.permanentGames.forEach((gameName,i)=>{
    var gameUUID = generateUUID();
    server.games.set(gameUUID, new (server.gameTypes.get(gameName))(gameUUID, "Elemental Chess #"+(i+1), [], server)); //This is unholier
});
//TODO: Create new games as they're needed

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
    res.send(Array.from(server.games.values()).map(game=>{
        var gameInfo = { //Don't send the entire server object over as part of each game
            uuid: game.uuid, //each "game" is a [uuid,Game] pair
            name: game.name,
            players: game.players.map(client=>client.uuid) //TODO: clients or users?
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
        case "chat": //Local to your current game
            if(!client.curGame){
                console.log("Client %s failed to chat: Not in a game", client.uuid);
            } else {
                client.curGame.players.forEach((targetClient) => {
                    targetClient.send({
                        type: "chat",
                        sender: client.user.name,
                        content: msg.content
                    });
                });
            }
            break;
        case "gameJoin":
            var game = server.games.get(msg.gameUUID);
            if(!game){
                //TODO: Notify client here too, as below
                console.log("Client %s failed to join game %s: Game does not exist", client.uuid, msg.gameUUID);
            } else if(game.players.length >= game.maxPlayers){
                //TODO: Notify client and return them to the homepage, or let them watch/spectate (add watch/spectate button to homepage game list?)
                console.log("Client %s failed to join game %s: Game already full", client.uuid, msg.gameUUID); //TODO: game.uuid instead of msg.gameUUID?
            } else {
                game.players.push(client);
                client.curGame = game;
                console.log("Client %s joined game %s", client.uuid, msg.gameUUID);
                if(game.players.length == game.maxPlayers){ //TODO: Better ways to start a game? Ready system? Eg. player list w/ ready display, checkbox by submit button, gameReady and gameUnready, etc.?
                    game.start(); //TODO: Setup/start/etc. sequence?
                    console.log("Game %s started!", msg.gameUUID);
                }
            }
            break;
        case "gameDecision":
            client.curGame.process(client, msg.decision);
            //TODO: Do some processing here, or just let the game handle everything? Probably the second-- that provides the most modularity and the least coupling.
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