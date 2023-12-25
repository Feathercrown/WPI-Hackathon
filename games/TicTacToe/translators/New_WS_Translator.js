const Translator = require('../../../common/Translator.js');

class New_WS_Translator extends Translator {
    constructor(room){
        super(room);
    }

    receive(client, msg){
        console.log("New WS translator received: "+msg);
        //Process msg here (TODO)
        this.game.process(client, msg);
    }

    send(client, msg){
        console.log("New WS translator sent: "+msg);
        //Process msg here (TODO)
        client.send(msg);
    }
}

module.exports = New_WS_Translator;
