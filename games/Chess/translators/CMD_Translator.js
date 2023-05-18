const Translator = require('../../../common/Translator.js');

class CMD_Translator extends Translator {
    constructor(room){
        super(room);
    }

    receive(client, msg){
        console.log("CMD translator received: "+msg);
        var args = msg.split(' ');
        var pieceX = args[1].split('')[0];
        var pieceY = args[1].split('')[1];
        var moveX = args[2].split('')[0];
        var moveY = args[2].split('')[1];
        switch(args[0]){
            case 'move':
            case 'capture':
            case 'doubleStep':
            case 'enPassent':
                if(pieceX && pieceY && (/^[ABCDEFGH]$/).test(pieceX) && (/^[12345678]$/).test(pieceY)
                && moveX && moveY && (/^[ABCDEFGH]$/).test(moveX) && (/^[12345678]$/).test(moveY)){
                    this.game.process(client, { //TODO: Use return values and flatMap them then process them instead of having the translator manually call methods? Or have that be a soft interface, not a hard rule?
                        piece: [alphaToNum(pieceX), pieceY-1],
                        type: args[0], //TODO: This is probably not ideal?
                        args: [[alphaToNum(moveX), moveY-1]]
                    });
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
            case 'help': //TODO
                break;
            default:
                console.log('Unknown command'); //TODO
                break;
        }
        function alphaToNum(letter){
            return ('ABCDEFGH').split('').findIndex(l => l==letter); //TODO: This entire game is missing error handling everywhere
        }
    }

    send(client, msg){
        console.log("CMD translator sent: "+msg);
        var display = '\r\n';
        for(var y=7; y>=0; y--){
            display += ' ';
            for(var x=0; x<8; x++){
                display += pieceToSymbol(msg.state.board[y][x].piece);
            }
            display += '\r\n';
        }
        display += '\x1B[0m\r\n'; //Reset colors
        /*
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
        */
        display += '\r\n\r\n > ';
        client.send(display);

        function pieceToSymbol(piece){
            if(piece == null){
                return ' ';
            } else {
                //var baseCodePoint = piece.color == 'white' ? 1 : 2;
                var symbol = ({
                    'Pawn': 'o', //TODO: String.fromCodePoint(`0x${2659}`),
                    'Rook': 'R',
                    'Knight': 'N',
                    'Bishop': 'B',
                    'Queen': 'Q',
                    'King': 'K',
                })[piece.constructor.name] || '?';
                var colorCode = piece.color == 'white' ? '\x1B[37m' : '\x1B[35m'; //Black is magenta because that shows up on both Command Prompt and Powershell; TODO: Set background color!
                return colorCode + symbol;
            }
        }
    }
}

module.exports = CMD_Translator;
