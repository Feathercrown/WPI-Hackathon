class Translator {
    constructor(room){
        this.room = room;
        this.server = room.server; //TODO: Accessors, not instance variables? This ensures these values won't get overwritten and desync
        this.game = room.game;
    }

    receive(client, msg){
        console.log("Translator received: "+msg);
        //Process msg here
        this.room.game.process(client, msg);
    }

    send(client, msg){
        console.log("Translator sent: "+msg);
        //Process msg here
        client.send(msg);
    }
}

module.exports = Translator;
