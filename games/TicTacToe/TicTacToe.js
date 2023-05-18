const Game = require('../../common/Game.js');

class TicTacToe extends Game {
    constructor(){
        super();
        this.maxPlayers = 2; //TODO: Move maxPlayers and maybe "ready" to Room?
        this.ready = false; //Determines if players can submit new moves or not
        this.state = {
            turn: 0,
            winner: null,
            board: [
                [' ',' ',' '],
                [' ',' ',' '],
                [' ',' ',' '],
            ]
        };
    }

    start(){
        //this.setup(); //TODO: No setup for TicTacToe?
        this.ready = true;
        this.updatePlayers();
    }

    updatePlayers(){
        this.room.send(this.state); //TODO: This is kinda weird? Works for now tho lol :)
    }

    process(client, location){
        if(!this.ready){return;} //TODO: Logging/error handling
        if(this.players[this.state.turn] != client){return;}

        var valid = this.state.board[location.y][location.x] == ' ';
        if(valid){ //Can move
            this.state.board[location.y][location.x] = this.state.turn==0?'X':'O';
            this.updateWinner(client, location, this.state.turn==0?'X':'O');
            this.state.turn = +(!this.state.turn);
            this.updatePlayers();
        }
    }

    updateWinner(client, location, piece){
        var board = this.state.board;
        if(board[location.y][0] == piece && board[location.y][1] == piece && board[location.y][2] == piece
        || board[0][location.x] == piece && board[1][location.x] == piece && board[2][location.x] == piece
        || board[0][0] == piece && board[1][1] == piece && board[2][2] == piece
        || board[0][2] == piece && board[1][1] == piece && board[2][0] == piece
        ){
            this.state.winner = client;
            this.ready = false;
        } else if(board.every(row=>row.every(cell=>cell!=' '))){
            this.state.winner = 'tie'; //TODO: Bruh mixing data types is cringe
        }
    }

    /*
    receive(client, decision){

    }

    send(decision){

    }
    */
}

var translators = {};
translators.WS_Client = require('./translators/WS_Translator.js');
translators.CMD_Client = require('./translators/CMD_Translator.js');

module.exports = { game: TicTacToe, translators };
