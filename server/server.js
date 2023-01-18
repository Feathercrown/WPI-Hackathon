//Imports and Configuration
const server = {
    clients: new Map(),
    games: new Map(),
    gameTypes: new Map()
};
server.config = require('./config.json');
const generateUUID = require('uuid').v4;
const randName = require("random-anonymous-animals");

//Websockets
const ws = require('ws');
server.wss = new ws.WebSocketServer({ port: server.config.websocketPort });
const WS_Client = require('../clients/WS_Client/WS_Client.js').WS_Client;

//Express
const express = require('express');
var bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path/posix');
server.app = express();

////////////

//Load all games
server.getGames = function(predicate){ //TODO: getGames or countGames?
    return Array.from(this.games.values()).filter(game => predicate(game));
};
server.createGame = function(gameType){
    var gameUUID = generateUUID();
    var gameNum = server.getGames(game => game instanceof this.gameTypes.get(gameType)).length + 1;
    //this.games.set(gameUUID, new (this.gameTypes.get(gameType))(gameUUID, `${gameType} #${gameNum}`, [], this)); //TODO: Readd numbering by committing to the naming strategy and having each game have a unique (not universally, just that two can't exist at once) number instead of a game name (and calculate the game name from the game type and number)
    this.games.set(gameUUID, new (this.gameTypes.get(gameType))(gameUUID, gameType, [], this)); //name=type, players=[], server=this
};
fs.readdir(path.join(__dirname, '../games'), { withFileTypes: true }, (error, files) => {
    if(error){console.error(error);}
    files.forEach(file => {
        if(file.isDirectory()){
            //Load the game into memory and start a buffer of instances
            var gameType = file.name;
            try { //try-catch the game file loading process since fs.exists() isn't recommended. Yeah, a config file seems like the right move... although that wouldn't stop me from needing to use this try/catch anyways.
                server.gameTypes.set(gameType, require(`../games/${gameType}/${gameType}.js`)); //This is unholy, but only a little. TODO: Have a manifest or config of some sort to determine which file(s) to load the game(s) (+variants?) from?
                for(var i=0; i<server.config.unusedGameBuffer; i++){ //TODO: Convert createGame to createGames and use that here?
                    server.createGame(gameType);
                }
                //TODO: Permanent games from config?
            } catch(err) {
                var translations = {
                    'MODULE_NOT_FOUND': 'No game file found', //TODO: This error will always be thrown for Common... maybe having Common be a game folder isn't a great idea? Or just name the Game generic file Common and allow it to be loaded and used for some reason?
                };
                console.error(`Error: Could not load game ${gameType}: ${translations[err.code] || `Unrecognized reason (${err.code})`}`);
                if(!translations[err.code]){console.error(err);}
            }
        }
    });
});



//Express Server
server.app.get('/', (req, res, next) => {
    var options = {
        root: path.join(__dirname, '../clients/WS_Client/public'),
        dotfiles: 'deny',
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true
        }
    };
    res.sendFile('/index.html', options, function (err) {
        if (err) {
            console.error('Error: Failed to send homepage');
            next(err);
        } else {
            console.log(`Sent homepage`);
        }
    });
})

server.app.use('/', express.static('clients/WS_Client/public'));
server.app.use('/games', express.static('games')); //TODO: Pass images directly as blobs? No, keep game folder public, it can have rules PDFs and other useful things in it as well!

//REST API
server.app.use(bodyParser.urlencoded({ extended: true }));
server.app.get('/api/games', (req, res) => {
    res.send(Array.from(server.games.values()).map(game=>{ //Send in array format to make parsing easier on the frontend, since Maps can't be sent through JSON (afaik)
        var gameInfo = { //Don't send the entire server object over as part of each game
            uuid: game.uuid, //each "game" is a [uuid,Game] pair
            name: game.name,
            players: game.players.map(client=>client.uuid) //TODO: clients or users?
        }
        return gameInfo;
    }));
});
server.app.get('/api/announcements', (req, res) => {
    res.send(server.config.announcements); //That Was Easy(TM)
});

//Start Express Server
server.app.listen(server.config.expressPort, () => {
    console.log(`Game server listening at http://localhost:${server.config.expressPort}`);
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
                if(server.getGames(otherGame => otherGame.type === game.type && otherGame.players.length == 0).length < server.config.unusedGameBuffer){ //TODO: Misnomer, otherGame can equal game
                    console.log(`Creating new game of ${game.type} to replace newly occupied game`);
                    server.createGame(game.type);
                }
            }
            break;
        case "gameLeave":
            var game = server.games.get(msg.gameUUID); //TODO: Do this, or get game uuid from client?
            client.curGame = null;
            if(!game){
                console.log("Client %s failed to leave game %s: Game does not exist", client.uuid, msg.gameUUID);
            } else {
                game.players = game.players.filter(player => player != client);
                if(game.players.length == 0 && server.getGames(otherGame => otherGame.type === game.type && otherGame.players.length == 0).length > server.config.unusedGameBuffer){
                    console.log(`Removing unneeded empty game of ${game.type}`);
                    server.games.delete(game.uuid);
                }
                //TODO: Archive game; prevent new joins; etc.
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
