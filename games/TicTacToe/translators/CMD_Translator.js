const Translator = require('../../../common/Translator.js');

class CMD_Translator extends Translator {
    constructor(room){
        super(room);
    }

    receive(client, msg){
        console.log("CMD translator received: "+msg);
        //Process msg here (TODO)
        this.game.process(client, msg);
    }

    send(client, msg){
        console.log("CMD translator sent: "+msg);
        //Process msg here (TODO)
        client.send(msg);
    }
}

module.exports = CMD_Translator;
