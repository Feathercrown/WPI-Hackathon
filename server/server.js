const server = {};
server.config = require('../config.json');
const generateUUID = require('uuid').v4;
const ws = require('ws');
server.wss = new ws.WebSocketServer({ port: server.config.websocketPort });
const express = require('express');
const path = require('path/posix');
server.app = express();
const WS_Client = require('./WS_Client.js').WS_Client;
const randName = require("random-anonymous-animals");

//Express Server
server.app.get('/', (req, res, next) => {
    var options = {
        root: path.join(__dirname, '../client'),
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

server.app.use(express.static('client'));

server.app.listen(server.config.expressPort, () => {
    console.log(`Example app listening at http://localhost:${server.config.expressPort}`);
});



//Websocket Server
const clients = new Map();

server.wss.on('connection', function connection(ws, req) {
    var clientUUID = generateUUID();
    var client = new WS_Client(clientUUID, randName(clientUUID), ws, server);
    clients.set(client.uuid, client); //TODO: client.uuid or clientUUID?
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
        case "login": //What happens if you try to log in or out while playing a game? Are games tied to clients or users?
            //Log in or error
            break;
        case "logout":
            //Log out
            break;
        case "chat":
            clients.forEach((targetClient) => {
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
        default:
            console.error("Error: Client sent message with no type");
            break;
    }
};

server.send = function (msg, client) {
    client.send(msg);
};