const Translator = require('../../../common/Translator.js');

class WS_Translator extends Translator {
    constructor(room){
        super(room);
    }

    receive(client, msg){
        console.log("WS translator received: "+msg);
        this.game.process(client, msg.decision);
    }

    send(client, msg){
        console.log("WS translator sent: "+msg);
        client.send(msg);
    }
}

module.exports = WS_Translator;
