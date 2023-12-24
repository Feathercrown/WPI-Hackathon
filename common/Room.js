//TODO: Move Room.js out of /Common, or /Common out of /games?
class Room {
    constructor(uuid, name, game, translators, players, server){ //TODO: Take config and instantiate game in here?
        this.uuid = uuid;
        this.name = name;
        this.players = players;
        this.server = server;
        this.game = game;
        this.game.room = this;
        this.translators = {};
        Object.getOwnPropertyNames(translators).forEach(propName=>{ //For every defined translator, instantiate and add it to this room
            this.translators[propName] = new translators[propName](this);
        });
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
            //console.log(Object.getOwnPropertyNames(translator));
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
