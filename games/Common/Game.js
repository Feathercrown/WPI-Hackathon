class Game {
    constructor(uuid, name, players, server){
        this.uuid = uuid;
        this.name = name;
        this.players = players;
        this.server = server;
    }
}

module.exports = Game;