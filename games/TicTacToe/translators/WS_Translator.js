const Translator = require('../../Common/Translator.js');

class WS_Translator extends Translator {
    constructor(room){
        super(room);
    }

    receive(client, msg){
        console.log("WS translator received: "+msg);
        //Process msg here (TODO)
        this.game.process(client, msg);
    }

    send(client, msg){
        console.log("WS translator sent: "+msg);
        //Process msg here (TODO)
        client.send(msg);
    }
}

module.exports = WS_Translator;
