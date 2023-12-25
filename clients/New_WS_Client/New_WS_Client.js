class New_WS_Client {
    constructor(uuid, name, ws, server){
        this.type = "New_WS_Client"; //TODO: this.constructor.name;
        this.uuid = uuid;
        this.user = {
          name: name, //Previously `Guest (${this.uuid})`; now the server determines a random animal name
          guest: true
        };
        this.ws = ws;
        this.server = server;
        this.room = null;

        //Heartbeat to ensure client stays connected
        this.alive = true;
        this.pingInterval = setInterval(()=>{
            if(!this.alive){ //If last ping not ponged
                this.ws.terminate(); //Close WS connection
                this.receive({ //Spoof the gameLeave event
                    type: 'gameLeave',
                    gameUUID: this.room ? this.room.uuid : '' //JUST in case (TODO: Nullish coalescing?)
                });
                clearInterval(this.pingInterval);
                this.server.clients.delete(this.uuid);
                console.log(`Client ${this.uuid} timed out and was deleted`);
                //TODO: This should be all, right?
            } else {
                this.alive = false;
                this.ws.ping();
            }
        }, this.server.config.WSClientTimeout)
        ws.on('pong', ()=>{this.alive=true;});

        //Receive messages from the client and pass them to the server
        ws.on('message', (msg) => {
            try {
                var msgData = JSON.parse(msg.toString());
                this.receive(msgData, this);
            } catch(e){
                console.error(e);
                console.warn("Client %s sent message in string format");
                //TODO: Convert to usable JSON object and continue
            }
        });

        //TODO: Respond to close event the same way we do with timeouts
    }

    //Receive messages from the client and pass them to the server
    receive(msg){
        if(this.room == null){ //TODO: Better way of distinguishing where to send the message?
            this.server.receive(this, msg);
        } else {
            this.room.receive(this, msg);
        }
    }

    //Receive messages from the server and pass them to the client
    send(msg){
        //TODO: Check for CONNECTING, CLOSING, or CLOSED state and throw exception
        this.ws.send(JSON.stringify(msg));
    }
}

module.exports = {New_WS_Client};
