class CMD_Client { //TODO: Extend a general client class
    constructor(uuid, name, socket, server){
        this.type = "CMD_Client"; //TODO: this.constructor.name;
        this.uuid = uuid;
        this.user = {
          name: name, //Previously `Guest (${this.uuid})`; now the server determines a random animal name
          guest: true
        };
        this.socket = socket; //TODO: Convert ws to socket in WS_Client and New_WS_Client
        this.server = server;
        this.room = null;

        //No heartbeat possible using Telnet? (TODO)
        this.alive = true;
        socket.on('close',()=>{this.alive=false;});

        //Receive messages from the client and pass them to the server
        //Requires a decent amount of processing - TODO: Use a proper state machine, with recursion maybe?
        this.dataBuffer = '';
        this.state = 'normal';
        socket.on('data', (data)=>{
            this.state = 'normal'; //Assume escape sequences last until the end of the last chunk of data and no further (TODO: Part of esc seq hack)
            data = data.toString();
            data.split('').forEach(data => {
                var code = data.charCodeAt(0);
                console.log(data, Array.from(data).map(char=>char.charCodeAt(0)));
                if(this.state == 'escapeSeq'){
                    //TODO: Properly handle escape sequences (somehow!)
                } else if(this.state == 'postEnter' && code == 10){
                    //Ignore character to allow \r\n
                } else if(this.state == 'telnetCommand'){
                    if(code != 65533){
                        this.state = 'normal';
                    }
                } else if(this.state == 'normal' || this.state == 'postEnter'){
                    switch(code){
                        case 65533: //Telnet protocol commands; silently ignore because we're using telnet as a plain socket (and Unicode messes with them anyways)
                            this.state = 'telnetCommand';
                            break;
                        case 13: //Enter
                            this.receive(this.dataBuffer);
                            this.state = 'postEnter';
                            //console.log(Array.from(this.dataBuffer).map(char=>char.charCodeAt(0)));
                            this.dataBuffer = '';
                            break;
                        case 8: //Backspace
                            this.dataBuffer = this.dataBuffer.slice(0,-1);
                            break;
                        case 27: //Escape sequences
                            this.state = 'escapeSeq';
                            //lol idk
                            //See the following: https://tldp.org/HOWTO/Bash-Prompt-HOWTO/x361.html
                            break;
                        default: //Normal characters
                            this.dataBuffer += data;
                            break;
                    }
                }
            });
        });
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
        this.socket.write('\x1B[2J'+msg);
    }
}

module.exports = {CMD_Client};
