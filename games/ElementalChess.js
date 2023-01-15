const Game = require('./Game.js');

class ElementalChess extends Game {
    constructor(uuid, name, players, server){
        super(uuid, name, players, server);
        this.maxPlayers = 2;
    }

    start(){ //TODO: Args?

    }
}

module.exports = ElementalChess;