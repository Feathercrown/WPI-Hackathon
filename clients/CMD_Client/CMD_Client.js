class CMD_Client {
    constructor(uuid, name, socket, server){
        this.type = "CMD_Client"; //TODO: this.constructor.name;
        this.uuid = uuid;
        this.user = {
          name: name, //Previously `Guest (${this.uuid})`; now the server determines a random animal name
          guest: true
        };
        this.socket = socket; //TODO: Convert ws to socket in WS_Client
        this.server = server;
        this.room = null;

        //No heartbeat possible using Telnet? (TODO)
        this.alive = true;
        socket.on('close',()=>{this.alive=false;});

        //Receive messages from the client and pass them to the server
        //Requires a decent amount of processing
        //TODO: Errors will happen when receiving multiple chars / esc seqs at once into 'data'
        this.dataBuffer = '';
        socket.on('data', (data)=>{
            data = data.toString();
            console.log(data, Array.from(data).map(char=>char.charCodeAt(0)));
            switch(data.charCodeAt(0)){
                case 13: //Enter
                    this.receive(this.dataBuffer);
                    this.dataBuffer = '';
                    break;
                case 27: //Escape sequences
                    //lol idk
                    //See the following: https://tldp.org/HOWTO/Bash-Prompt-HOWTO/x361.html
                    break;
                default: //Normal characters
                    this.dataBuffer += data;
                    break;
            }
        });

        //TODO: Remove
        socket.write("peepeepoopoo\r\n");
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
        //TODO: Check for CONNECTING, CLOSING, or CLOSED state and throw exception? Is that possible with this socket type?
        this.socket.write(msg);
    }
}

module.exports = {CMD_Client};
