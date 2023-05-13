//TODO: Move Room.js out of /Common, or /Common out of /games?
class Room {
    constructor(uuid, name, game, players, server){
        this.uuid = uuid;
        this.name = name;
        this.players = players;
        this.server = server;
        this.game = game;
        this.game.room = this;

        var curRoom = this;
        this.translators = { //TODO: Don't hardcode these //Also TODO: Just attach the translators to the game itself, don't keep track of them separately
            "WS_Client": {
                room: curRoom,
                receive: function(client, msg){
                    console.log("WS_Client translator received: "+msg);
                    this.room.game.process(client, msg.decision);
                },
                send: function(client, msg){
                    console.log("WS_Client translator sent: "+msg);
                    client.send(msg);
                }
            },
            "CMD_Client": {
                room: curRoom,
                receive: function(client, msg){
                    console.log("CMD_Client translator received: "+msg);
                    this.room.game.process(client, msg.decision);
                },
                send: function(client, msg){ //TODO: Reverse order of args (globally)?
                    console.log("CMD_Client translator sent: "+msg);
                    client.send(msg);
                }
            }
        };
    }

    /*
    get type(){
        return this.constructor.name;
    }
    */

    addPlayer(client){
        this.players.push(client);
        client.room = this;
        //this.addPlayer(this.players.length-1); //TODO: Notify game
    }

    removePlayer(client){
        //TODO: Use "this.players = this.players.filter(player => player != client);" ?
        var playerIndex = this.players.findIndex(player => player==client);
        //this.players[playerIndex] = null;
        //this.removePlayer(playerIndex); //TODO: Notify game (requires knowing the player index so can't use the shortcut above?)
        this.players.splice(playerIndex, 1); //Removes the player from the players array
        client.room = null;
    }

    receive(client, message){
        var translator = this.translators[client.type];
        if(translator){
            console.log(Object.getOwnPropertyNames(translator));
            translator.receive(client, message);
        } else {
            console.error("Error: Game has no translator.receive for client of type "+client.type);
        }
    }

    send(message){
        this.players.forEach(client => {
            var translator = this.translators[client.type];
            if(translator){
                translator.send(client, message);
            } else {
                console.error("Error: Game has no translator.send for client of type "+client.type);
            }
        })
    }
}

module.exports = Room;
