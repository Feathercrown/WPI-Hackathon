const Game = require('../../common/Game.js');

class TestGame extends Game {
    constructor(){
        super();
        this.maxPlayers = 2;
        this.ready = false; //Determines if players can submit new moves or not
    }

    setup(){
        this.state = {

        };
    }

    start(){
        this.setup(); //For now; could be called from the server instead eventually (TODO?)
        this.ready = true;
        this.updatePlayers();
    }

    process(client, decision){
        this.updatePlayers();
    }

    //Notify players of the current gamestate and their new options
    updatePlayers(){
        this.room.send({
            state: this.state,
            players: this.players
        });
    }
}

var translators = {};
//translators.WS_Client = require('./translators/WS_Translator.js');
translators.New_WS_Client = require('./translators/New_WS_Translator.js');
//translators.CMD_Client = require('./translators/CMD_Translator.js');

module.exports = { game: TestGame, translators };
