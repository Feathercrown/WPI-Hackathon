//Imports and Configuration
const server = {
    clients: new Map(),
    rooms: new Map(),
    gameRegistry: new Map()
};
server.config = require('./config.json');
const generateUUID = require('uuid').v4;
const randName = require("random-anonymous-animals");
const Room = require('../common/Room.js');

//Websockets
const ws = require('ws');
server.wss = new ws.WebSocketServer({ port: server.config.websocketPort });
const WS_Client = require('../clients/WS_Client/WS_Client.js').WS_Client;
server.new_wss = new ws.WebSocketServer({ port: server.config.websocketPort+1 });
const New_WS_Client = require('../clients/New_WS_Client/New_WS_Client.js').New_WS_Client;

//Express
const express = require('express');
var bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path/posix');
server.app = express();
server.new_app = express();

//Telnet
const telnet = require('net');
server.telnet = new telnet.Server();
const CMD_Client = require('../clients/CMD_Client/CMD_Client.js').CMD_Client;

////////////

//Helper functions
server.getRooms = function(predicate){ //TODO: getRooms or countRooms?
    return Array.from(this.rooms.values()).filter(room => predicate(room));
};
server.createRoom = function(gameType){ //TODO: Move translators to inside the games? Would make creating rooms and importing/exporting games much simpler and coupled to the instantiation process
    var roomUUID = generateUUID();
    //var gameNum = server.getRooms(room => room.game instanceof this.gameRegistry.get(gameType).game).length + 1;
    //TODO: Readd numbering by committing to the naming strategy and having each game have a unique (not universally, just that two can't exist at once) number instead of a game name (and calculate the game name from the game type and number)
    var gameRegistryEntry = this.gameRegistry.get(gameType);
    var game = new (gameRegistryEntry.game)();
    var translators = gameRegistryEntry.translators;
    var room = new Room(roomUUID, gameType, game, translators, [], this); //uuid, name, game, translators, players, server
    this.rooms.set(roomUUID, room);
};

//Load all games
fs.readdir(path.join(__dirname, '../games'), { withFileTypes: true }, (error, files) => {
    if(error){console.error(error);}
    files.forEach(file => {
        if(file.isDirectory()){
            //Load the game into memory and start a buffer of instances
            var gameType = file.name;
            try { //try-catch the game file loading process since fs.exists() isn't recommended. Yeah, a config file seems like the right move... although that wouldn't stop me from needing to use this try/catch anyways.
                server.gameRegistry.set(gameType, require(`../games/${gameType}/${gameType}.js`)); //This is unholy, but only a little. TODO: Have a manifest or config of some sort to determine which file(s) to load the game(s) (+variants?) from?
                for(var i=0; i<server.config.unusedGameBuffer; i++){
                    server.createRoom(gameType);
                }
                //TODO: Permanent games from config?
            } catch(err) {
                var translations = { //TODO: Standardize error translations
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
});
server.new_app.get('/', (req, res, next) => {
    var options = {
        root: path.join(__dirname, '../clients/New_WS_Client/public'),
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
});

server.app.use('/', express.static('clients/WS_Client/public'));
server.new_app.use('/', express.static('clients/New_WS_Client/public'));
server.app.use('/games', express.static('games')); //TODO: Pass images directly as blobs? No, keep game folder public, it can have rules PDFs and other useful things in it as well!
server.new_app.use('/games', express.static('games'));

//REST API
server.app.use(bodyParser.urlencoded({ extended: true }));
server.app.get('/api/games', (req, res) => {
    res.send(Array.from(server.rooms.values()).map(room=>{ //Send in array format to make parsing easier on the frontend, since Maps can't be sent through JSON (afaik)
        var roomInfo = { //Don't send the entire server object over as part of each game
            uuid: room.uuid, //each "game" is a [uuid,Game] pair
            name: room.name,
            players: room.players.map(client=>client.uuid) //TODO: clients or users? //TODO: client.user.name?
        }
        return roomInfo;
    }));
});
server.app.get('/api/announcements', (req, res) => {
    res.send(server.config.announcements); //That Was Easy(TM)
});

server.new_app.use(bodyParser.urlencoded({ extended: true }));
server.new_app.get('/api/games', (req, res) => {
    res.send(Array.from(server.rooms.values()).map(room=>{ //Send in array format to make parsing easier on the frontend, since Maps can't be sent through JSON (afaik)
        var roomInfo = { //Don't send the entire server object over as part of each game
            uuid: room.uuid, //each "game" is a [uuid,Game] pair
            name: room.name,
            players: room.players.map(client=>client.uuid) //TODO: clients or users? //TODO: client.user.name?
        }
        return roomInfo;
    }));
});
server.new_app.get('/api/announcements', (req, res) => {
    res.send(server.config.announcements); //That Was Easy(TM)
});

//Start Express Server
server.app.listen(server.config.expressPort, () => {
    console.log(`Old web server listening at http://localhost:${server.config.expressPort}`);
});
server.new_app.listen(server.config.expressPort+1, () => {
    console.log(`New web server listening at http://localhost:${server.config.expressPort+1}`);
});



//Websocket Server
server.wss.on('connection', function connection(ws, req) {
    var clientUUID = generateUUID();
    var client = new WS_Client(clientUUID, randName(clientUUID), ws, server);
    server.clients.set(client.uuid, client);
    console.log("Old Websocket connection with UUID %s", client.uuid);
});

server.wss.on('close', function close() {
    console.log('Old Websocket server closed');
});

//TODO: server.wss.listen?

server.new_wss.on('connection', function connection(ws, req) {
    var clientUUID = generateUUID();
    var client = new New_WS_Client(clientUUID, randName(clientUUID), ws, server);
    server.clients.set(client.uuid, client);
    console.log("New Websocket connection with UUID %s", client.uuid);
});

server.new_wss.on('close', function close() {
    console.log('New Websocket server closed');
});



//Telnet Server
server.sendGameList = function(socket){
    function clamp(string, length){
        return string.padEnd(length, ' ').slice(0, length);
    }
    var gameList = Array.from(server.rooms.values())
                        .map((room, idx) => `${idx+1}\t${clamp(room.name, 16)}\tPlayers: ${room.players.length}/${room.game.maxPlayers}`) //TODO: maxPlayers changes apply here
                        .reduce((acc, cur)=>{
                            return acc+cur+'\r\n'
                        }, '')
                        + 'Join a game with \'join <num>\'\r\nQuit with \'quit\'\r\n\r\n > ';
    socket.write(gameList);
}

server.telnet.on('connection', function connection(socket){
    var clientUUID = generateUUID();
    var client = new CMD_Client(clientUUID, randName(clientUUID), socket, server); //TODO: Rename CMD_Client to Telnet_Client?
    server.clients.set(client.uuid, client);
    console.log("New Telnet connection with UUID %s", client.uuid);
    server.sendGameList(socket);
});

server.telnet.on('close', function close() {
    console.log('Telnet server closed');
});

server.telnet.listen(server.config.telnetPort, () => {
    console.log(`Telnet server listening at localhost:${server.config.telnetPort}`);
});



//Server messages from clients
server.receive = function (client, msg) {
    switch (client.type) {
        case 'New_WS_Client':
        case 'WS_Client':
            console.log('Client %s sent message: %o', client.uuid, msg);
            switch (msg.type) {
                case "login": //Can a client switch users while playing a game? Are games tied to clients or users? Clients, because you can be userless (a guest)?
                    //Log in or error
                    break;
                case "logout":
                    //Log out
                    break;
                case "chat": //Local to your current game
                    if(!client.room){
                        console.log("Client %s failed to chat: Not in a game", client.uuid);
                    } else {
                        client.room.players.forEach((targetClient) => {
                            targetClient.send({
                                type: "chat",
                                sender: client.user.name,
                                content: msg.content
                            });
                        });
                    }
                    console.error("Error: Server received chat event (should not happen?)");
                    break;
                case 'nameChange': //TODO: Name changes happen outside of games? Guests can't change their names?
                    //TODO: Can logged-in users change their nickname?
                    //client.user.name = msg.newName; //TODO: Disabled for now until I can figure out how this should work
                    //TODO: Prevent changing your name to someone else's or a blank name and notify other users in the game of the change through a chat message
                    //TODO: Mark chat messages from the server specially? Also, prevent people from changing their name to "Server" (and RTL char and stuff! -- prevent in chat messages too?)
                    break;
                case "gameJoin":
                    var room = server.rooms.get(msg.gameUUID);
                    if(!room){
                        //TODO: Notify client here too, as below
                        console.log("Client %s failed to join game %s: Game does not exist", client.uuid, msg.gameUUID);
                    } else if(room.players.length >= room.game.maxPlayers){
                        //TODO: Notify client and return them to the homepage, or let them watch/spectate (add watch/spectate button to homepage game list?)
                        console.log("Client %s failed to join game %s: Game already full", client.uuid, msg.gameUUID);
                    } else {
                        room.addPlayer(client);
                        console.log("Client %s joined game %s", client.uuid, msg.gameUUID);
                        if(room.players.length == room.game.maxPlayers){ //TODO: Better ways to start a game? Ready system? Eg. player list w/ ready display, checkbox by submit button, gameReady and gameUnready, etc.?
                            room.game.start(); //TODO: Setup/start/etc. sequence?
                            console.log("Game %s started!", msg.gameUUID);
                        }
                        var emptyRoomsOfSameType = server.getRooms(otherRoom => otherRoom.game.type === room.game.type && otherRoom.players.length == 0).length;
                        if(emptyRoomsOfSameType < server.config.unusedGameBuffer){
                            console.log(`Creating new game of ${room.game.type} to replace newly occupied game`);
                            server.createRoom(room.game.type);
                        }
                    }
                    break;
                case "gameLeave":
                    var room = server.rooms.get(msg.gameUUID);
                    if(!room){
                        console.log("Client %s failed to leave game %s: Game does not exist", client.uuid, msg.gameUUID);
                    } else {
                        room.removePlayer(client);
                        var emptyRoomsOfSameType = server.getRooms(otherRoom => otherRoom.game.type === room.game.type && otherRoom.players.length == 0).length;
                        if(room.players.length == 0 && emptyRoomsOfSameType > server.config.unusedGameBuffer){
                            console.log(`Removing unneeded empty game of ${room.game.type}`);
                            server.rooms.delete(room.uuid);
                        }
                        //TODO: Archive game; prevent new joins; etc.
                    }
                    break;
                case "gameDecision":
                    client.room.game.process(client, msg.decision);
                    console.error("Error: Server received gameDecision event (should not happen!)");
                    break;
                case "":
                    console.error("Error: Client %s sent message with no type", client.uuid);
                    break;
                default:
                    console.error("Error: Client %s sent message with unrecognized type %s", client.uuid, msg.type);
                    break;
            }
            break;
        case 'CMD_Client':
            console.log("Client %s received message: %s", client.uuid, msg);
            args = msg.split(' ');
            switch (args[0]) {
                case 'exit':
                case 'quit':
                case 'q':
                case 'help': //TODO: lmao
                case 'leave':
                    //TODO
                    client.socket.end();
                    break;
                case 'join':
                    var idx = args[1]-1; //TODO: Error handling
                    var room = Array.from(server.rooms.values())[idx];
                    //Begin paste from WS_Client handler (TODO: Merge with that handler)
                    if(!room){
                        //TODO: Notify client here too, as below
                        console.log("Client %s failed to join game [no uuid; index %s]: Game does not exist", client.uuid, idx);
                    } else if(room.players.length >= room.game.maxPlayers){
                        //TODO: Notify client and return them to the homepage, or let them watch/spectate (add watch/spectate button to homepage game list?)
                        console.log("Client %s failed to join game %s: Game already full", client.uuid, room.uuid);
                    } else {
                        room.addPlayer(client);
                        console.log("Client %s joined game %s", client.uuid, room.uuid);
                        if(room.players.length == room.game.maxPlayers){ //TODO: Better ways to start a game? Ready system? Eg. player list w/ ready display, checkbox by submit button, gameReady and gameUnready, etc.?
                            room.game.start(); //TODO: Setup/start/etc. sequence?
                            console.log("Game %s started!", room.uuid);
                        }
                        var emptyRoomsOfSameType = server.getRooms(otherRoom => otherRoom.game.type === room.game.type && otherRoom.players.length == 0).length;
                        if(emptyRoomsOfSameType < server.config.unusedGameBuffer){
                            console.log(`Creating new game of ${room.game.type} to replace newly occupied game`);
                            server.createRoom(room.game.type);
                        }
                    }
                    //End paste
                    break;
                default:
                    console.error(`Error: Unknown command received from client ${client.uuid}: ${args[0]}`);
                    break;
            }
            break;
        default:
            console.error(`Error: Message received from client with unknown type ${client.type}. Message:`, msg);
            break;
    }
};

//Server messages to clients
server.send = function (client, msg) { //TODO: Deal with this properly (maybe have translators for the server too?)
    client.send(msg);
};
