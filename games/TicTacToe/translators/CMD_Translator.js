const Translator = require('../../../common/Translator.js');

class CMD_Translator extends Translator {
    constructor(room){
        super(room);
    }

    receive(client, msg){
        console.log("CMD translator received: "+msg);
        var args = msg.split(' ');
        switch(args[0]){
            case 'go':
            case 'move':
            case 'place':
            case 'put':
                if(args[1] && args[2] && (/^[012]$/).test(args[1]) && (/^[012]$/).test(args[2])){
                    this.game.process(client, {x:args[1],y:args[2]}); //TODO: Use return values and flatMap them then process them instead of having the translator manually call methods? Or have that be a soft interface, not a hard rule?
                } else {
                    client.socket.write('\r\n\r\nInvalid arguments. Try again:\r\n\r\n > ');
                }
                break;
            case 'quit':
            case 'exit':
            case 'leave':
            case 'q':
                //TODO: Boot back to 'main menu'?
                client.socket.end();
                break;
            case 'help':
                break;
            default:
                console.log('Unknown command'); //TODO
                break;
        }
    }

    send(client, msg){
        console.log("CMD translator sent: "+msg);
        var display = '\r\n';
        for(var i=0; i<3; i++){
            display += ' ';
            for(var j=0; j<3; j++){
                display += msg.board[i][j];
                if(j!=2){
                    display += '|';
                }
            }
            if(i!=2){
                display += '\r\n -+-+-\r\n';
            } else {
                display += '\r\n\r\n';
            }
        }
        if(msg.winner == null){
            var playerNum = this.room.players.findIndex(player=>player==client);
            display += 'You are \''+(playerNum==0?'X':'O')+'\'.\r\n';
            display += 'Place pieces with \'go <x> <y>\'!\r\n';
            display += 'Quit with \'quit\'.'
        } else if(msg.winner == client){
            display += 'You win! :D';
        } else if(msg.winner == 'tie'){
            display += 'Draw! :|';
        } else {
            display += 'You lose! :(';
        }
        display += '\r\n\r\n > ';
        client.send(display);
    }
}

module.exports = CMD_Translator;
