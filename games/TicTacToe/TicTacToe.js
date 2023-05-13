const Game = require('../Common/Game.js');

class TicTacToe extends Game {
    constructor(){
        super();
        this.maxPlayers = 2; //TODO: Move maxPlayers and maybe "ready" to Room?
        this.ready = false; //Determines if players can submit new moves or not
    }

    start(){
        this.setup();
        this.ready = true;
        this.updatePlayers();
    }

    updatePlayers(){

    }

    receive(client, decision){

    }

    send(decision){

    }
}

var translators = {};
translators.WS_Client = require('./translators/WS_Translator.js');
translators.CMD_Client = require('./translators/CMD_Translator.js');

module.exports = { game: TicTacToe, translators };
