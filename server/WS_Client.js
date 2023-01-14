class WS_Client {
    constructor(uuid, ws, server){
        this.uuid = uuid;
        this.user = {
          name: `Guest (${this.uuid})`,
          guest: true
        };
        this.ws = ws;
        this.server = server;

        //Heartbeat to ensure client stays connected
        this.alive = true;
        this.pingInterval = setInterval(()=>{
            if(!this.alive){ //If last ping not ponged
                this.ws.terminate();
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
    }

    receive(msg){
        this.server.receive(msg, this);
    }

    //Receive messages from the server and pass them to the client
    send(msg){
        //TODO: Check for CONNECTING, CLOSING, or CLOSED state and throw exception
        this.ws.send(JSON.stringify(msg));
    }
}

module.exports = {WS_Client};