//TODO: Move Room.js out of /Common, or /Common out of /games?
class Room {
    constructor(uuid, name, game, players, server){
        this.uuid = uuid;
        this.name = name;
        this.players = players;
        this.server = server;
        this.game = game;
        var curRoom = this;
        this.translators = {
            "WS_Client": {
                room: curRoom,
                receive: function(msg){
                    console.log("WS_Client translator received: "+msg);
                    //this.room.game.receive(...)?
                },
                send: function(client, msg){
                    console.log("WS_Client translator sent: "+msg);
                    //client.send(...)?
                }
            },
            "CMD_Client": {
                room: curRoom,
                receive: function(msg){
                    console.log("CMD_Client translator received: "+msg);
                    //this.room.game.receive(...)?
                },
                send: function(client, msg){ //TODO: Reverse order of args?
                    console.log("CMD_Client translator sent: "+msg);
                    //client.send(...)?
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
        var playerIndex = this.players.findIndex(player => player==client);
        //this.players[playerIndex] = null;
        //this.removePlayer(playerIndex); //TODO: Notify game
        this.players.splice(playerIndex, 1); //Removes the player from the players array
        client.room = null;
    }

    receive(client, message){
        var translator = this.translators[client.type];
        if(translator){
            translator.receive(message);
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
