const Game = require('../Common/Game.js');

class Chess extends Game {
    constructor(uuid, name, players, server){
        super(uuid, name, players, server);
        this.maxPlayers = 2;
        this.ready = false; //Determines if players can submit new moves or not
    }

    setup(){
        this.state = {
            board: [],
            turn: 0, //players[this.state.turn] to access the current player
            captured: []
        };
        var board = this.state.board; //For shorthand
        for(var i=0; i<8; i++){
            board[i] = [];
            for(var j=0; j<8; j++){
                board[i][j] = {
                    x: j, //Literally only used in executeAction but w/e it's good to have on hand when needed
                    y: i,
                    square: new Square(), //Not really used but it's here for future chess variants, eg. Elemental Chess //EDIT: TODO: Pieces have positions, squares don't have pieces. Calculate that from piece positions.
                    piece: null
                };
            }
            switch(i) {
                case 0:
                    board[i][0].piece = new Rook("white");
                    board[i][7].piece = new Rook("white");
                    board[i][1].piece = new Knight("white");
                    board[i][6].piece = new Knight("white");
                    board[i][2].piece = new Bishop("white");
                    board[i][5].piece = new Bishop("white");
                    board[i][3].piece = new Queen("white"); //Queen on color, board[0][3] is white
                    board[i][4].piece = new King("white");
                break;
                case 1:
                    for(var j=0; j<8; j++){
                        board[i][j].piece = new Pawn("white");
                    }
                break;
                case 6:
                    for(var j=0; j<8; j++){
                        board[i][j].piece = new Pawn("black");
                    }
                break;
                case 7:
                    board[i][0].piece = new Rook("black");
                    board[i][7].piece = new Rook("black");
                    board[i][1].piece = new Knight("black");
                    board[i][6].piece = new Knight("black");
                    board[i][2].piece = new Bishop("black");
                    board[i][5].piece = new Bishop("black");
                    board[i][3].piece = new Queen("black"); //Queen on color, board[0][3] is black
                    board[i][4].piece = new King("black");
                break;
                default:
                    //Do nothing, board is already set
                break;
            }
        }
        this.state.board.forEach(row=>row.forEach(square=>{if(square.piece){square.piece.game = this; square.piece.board = this.state.board;}})); //Allow each piece to access the game that it's being used in
    }

    start(){
        this.setup(); //For now; could be called from the server instead eventually (TODO?)
        this.ready = true;
        this.updatePlayers();
    }

    process(client, decision){
        if(!this.ready){return;} //TODO: Logging/error handling
        if(this.players[this.state.turn] != client){return;}
        decision.piece = this.state.board[decision.piece[1]][decision.piece[0]].piece; //TODO: Improve this quick & dirty fix?
        if(decision.piece.captured){return;} //Just in case lmao
        console.log(decision);
        /*
        Decisions:
        {
            piece: [x,y] --> Piece,
            type: "move" etc.,
            args: [[x,y] or "long"/"short" for castling]
        }
        Actions:
        {
            type: "move",
            square: Square
        }
        */
        var valid = decision.piece.getValidActions();
        var matching = valid.filter(action=>{
            if(action.type==decision.type){
                if(action.type == "castle"){
                    if(action.distance == decision.args[0]){
                        return true;
                    }
                } else if(action.square == this.state.board[decision.args[0][1]][decision.args[0][0]]){
                    return true;
                }
            }
            return false;
        });
        if(matching.length > 1){
            console.error("Error: More than one matching valid action for this decision!");
        } else if(matching.length <= 0){
            console.error("Error: No matching valid actions for this decision!");
        } else if(matching.length == 1){
            var match = matching[0];
            this.executeAction(decision.piece, match);
        } else {
            //TODO: Error?
        }
    }

    executeAction(piece, action){
        //TODO: Check if valid here, rather than in process()? //Also, general TODO: Generic attempted movement action? Could be useful for ice in Elemental Chess; might just save it for that?
        switch(action.type){
            case "move":
                piece.moveTo(action.square.x, action.square.y); //Could use spread operator but it's a bit unnecessary/overkill here
                break;
            case "capture":
                piece.captureTo(action.square.x, action.square.y); //TODO: Converting to x/y and then back to a Square again every time an action is executed isn't super good practice, although even if I didn't I'd still have to convert for En Passent unless I passed two arguments in or something... oh well, no time!
                break;
            case "doubleStep":
                piece.doubleStep(); //Assume pawn, out of time (TODO)
                break;
            case "enPassent":
                piece.enPassentTo(action.square.x, action.square.y); //Could use spread operator but it's a bit unnecessary/overkill here
                break;
            default:
                //TODO: Handle this case
                break;
        }
        this.state.turn = +(!this.state.turn);
        //Reset pawn doublestep flag for all pawns of current player's color
        this.state.board.forEach((row,i)=>row.forEach((square,j)=>{
            if(square.piece && square.piece.color == (this.state.turn==0?"white":"black") && square.piece instanceof Pawn && square.piece.doubleStepped){
                square.piece.doubleStepped = false;
            }
        }));
        this.updatePlayers();
    }

    //Notify players of the current gamestate and their new options
    updatePlayers(){
        var tileWidth = 60; //In pixels. TODO: A (SHOULDN'T EVEN BE ON THE FRONTEND) (MAYBE SCALE IT ON THE FRONTEND?)
        var sprites = [];
        this.state.board.forEach((row,i)=>row.forEach((square,j)=>{
            if(square.piece){
                sprites.push({
                    src: "/games"+square.piece.src, //TODO: Have a more unified or elegant way to send sprites to clients?
                    x: j * tileWidth,
                    y: tileWidth*7 - i * tileWidth,
                    width: tileWidth,
                    height: tileWidth
                });
            }
        }));
        this.players.forEach((targetClient) => {
            targetClient.send({ //Can't send the entire gamestate-- only a snapshot. Need to determine how to do this generally, probably-- perhaps send images and positions to the client?? With shortcut actions they can take on those images?
                type: "gameStateUpdate",
                newState: {
                    sprites: sprites
                }
            });
        });

        //Gather and Translate Decisions
        var decisions = [];
        this.state.board.forEach((row,i)=>row.forEach((square,j)=>{
            if(square.piece && square.piece.color == (this.state.turn==0?"white":"black")){
                var actions = square.piece.getValidActions();
                var newDecisions = actions.map(action=>{
                    return {
                        piece: [j,i],
                        type: action.type,
                        args: [[action.square.x,action.square.y]]
                    };
                })
                decisions = decisions.concat(newDecisions);
            }
        }));
        this.players[this.state.turn].send({
            type: "decisionList",
            list: decisions
        });
        this.players[+(!this.state.turn)].send({
            type: "decisionList",
            list: []
        });
    }
}

module.exports = Chess;

class Piece {
    constructor(color, game){
        this.color = color || "uncolored"; //Not recommended to be left unset
        this.game = game || null; //Will often be set later; definitely not recommended to be left unset either, though!
        if(game){this.board = game.state.board;} //For easy access //TODO: Just pass game.state in and use that for everything? /?TODO: Auto-set this somehow?
        this.src = "";
    }

    get captured(){
        if(!this.game){return null;} //TODO: Error, possibly? Or nah?
        return this.game.state.captured.indexOf(this) != -1;
    }

    get position(){ //Not really ideal but oh well out of time (TODO?)
        if(!this.game){return null;} //TODO: Error, possibly? Or nah?
        if(this.captured){
            return null;
        } else {
            var matches = [];
            this.board.forEach((row,i)=>row.forEach((square,j)=>{
                if(square.piece == this){
                    matches.push({x:j,y:i}); //Careful! Must access squares with board[y][x] (TODO: Change to row/col terminology?)
                }
            }));
            if(matches.length > 1){
                //TODO
            } else if(matches.length <= 0){
                //TODO
            } else {
                return matches[0];
            }
        }
    }

    getValidActions(){
        return [];
    }

    capture(){
        this.getRel(0,0).piece = null;
        this.game.state.captured.push(this);
    }

    moveTo(x,y){
        if(this.board[y][x].piece){
            this.board[y][x].piece.capture();
        }
        this.getRel(0,0).piece = null;
        this.board[y][x].piece = this;
    }

    captureTo(x,y){
        this.moveTo(x,y);
        //When each board position tracks a singular piece, moving somewhere actually automatically captures. Very convenient, move+capture could actually be combined if it weren't for castling and En Passent (and those could be manually detected and screened out). That would probably be considered bad practice though, and would be bad for variants. In general, squares having pieces rather than vice versa is bad for expansion/variants, so this convenience will be eliminated in variants anyways as I'll probably switch to that paradigm in them.
    }

    getRelativeBoardPosition(deltaX, deltaY){
        var newX = this.position.x + deltaX;
        var newY = this.position.y + deltaY;
        if(newX < 0 || newX > 7 || newY < 0 || newY > 7){
            return null;
        } else {
            return this.board[newY][newX];
        }
    }

    getRel(x,y){ //Shorthand
        return this.getRelativeBoardPosition(x,y);
    }
}

class Pawn extends Piece {
    constructor(color){
        super(color);
        this.forward = color=="white"?1:-1;
        this.doubleStepped = false;
        this.src = "/Chess/pieces/pawn_"+this.color+".png";
    }

    getValidActions(){
        if(this.captured){return [];}
        var actions = [];
        var ahead = this.getRel(0, this.forward);
        var aheadLeft = this.getRel(-1, this.forward);
        var aheadRight = this.getRel(1, this.forward);
        var doubleStep = this.getRel(0, this.forward*2);
        var left = this.getRel(-1,0);
        var right = this.getRel(1,0);
        if(ahead && ahead.piece == null ){
            actions.push({
                type: "move",
                square: ahead
            });
            if(doubleStep && doubleStep.piece == null){
                actions.push({
                    type: "doubleStep",
                    square: doubleStep
                });
            }
        }
        if(aheadLeft){
            if(aheadLeft.piece != null && aheadLeft.piece.color != this.color){
                actions.push({
                    type: "capture",
                    square: aheadLeft
                });
            }
            if(left.piece != null && left.piece.doubleStepped && left.piece.color != this.color){ //TODO: Change to left and right instead of using getRel here; also, ensure no piece is in the way (can't normally happen)
                actions.push({
                    type: "enPassent",
                    square: aheadLeft
                });
            }
        }
        if(aheadRight){
            if(aheadRight.piece != null && aheadRight.piece.color != this.color){
                actions.push({
                    type: "capture",
                    square: aheadRight
                });
            }
            if(right.piece != null && right.piece.doubleStepped && right.piece.color != this.color){
                actions.push({
                    type: "enPassent",
                    square: aheadRight
                });
            }
        }
        return actions;
    }

    doubleStep(){
        this.moveTo(this.position.x, this.position.y + this.forward*2);
        this.doubleStepped = true;
    }

    enPassentTo(x,y){
        this.moveTo(x,y);
        this.board[y+this.forward*-1][x].piece.capture();
    }
}

class LinearMover extends Piece {
    constructor(color){
        super(color);
        this.directions = [];
    }

    getValidActions(){
        if(this.captured){return [];}
        var actions = [];
        var curSquare = [];
        this.directions.forEach((direction)=>{
            var j=1;
            while(true){
                curSquare = this.getRel(direction[0]*j, direction[1]*j);
                if(curSquare == null){
                    break;
                } else if(curSquare.piece != null){
                    if(curSquare.piece.color != this.color){
                        actions.push({
                            type: "capture",
                            square: curSquare
                        });
                    }
                    break;
                } else if(curSquare.piece == null){
                    actions.push({
                        type: "move",
                        square: curSquare
                    });
                    //Don't break; continue in this direction
                } else {
                    //TODO: Error? Shouldn't ordinarily be possible
                }
                j++;
            }
        });
        return actions;
    }
}

class Rook extends LinearMover {
    constructor(color){
        super(color);
        this.moved = false;
        this.directions = [
            [1,0],
            [-1,0],
            [0,1],
            [0,-1]
        ];
        this.src = "/Chess/pieces/rook_"+this.color+".png";
    }

    moveTo(x,y){
        if(this.board[y][x].piece){
            this.board[y][x].piece.capture();
        }
        this.getRel(0,0).piece = null;
        this.board[y][x].piece = this;
        this.moved = true; //Track movement for castling
    }
}

class Bishop extends LinearMover {
    constructor(color){
        super(color);
        this.directions = [
            [1,1],
            [1,-1],
            [-1,1],
            [-1,-1]
        ];
        this.src = "/Chess/pieces/bishop_"+this.color+".png";
    }
}

class Queen extends LinearMover {
    constructor(color){
        super(color);
        this.directions = [
            [1,0],
            [-1,0],
            [0,1],
            [0,-1],
            [1,1],
            [1,-1],
            [-1,1],
            [-1,-1]
        ];
        this.src = "/Chess/pieces/queen_"+this.color+".png";
    }
}

class RelativeMover extends Piece {
    constructor(color){
        super(color);
        this.deltas = [];
    }

    getValidActions(){
        if(this.captured){return [];}
        var actions = [];
        this.deltas.forEach((delta)=>{
            var curSquare = this.getRel(delta[0], delta[1]);
            if(curSquare == null){
                //Do nothing
            } else if(curSquare.piece != null && curSquare.piece.color != this.color){
                actions.push({
                    type: "capture",
                    square: curSquare
                });
            } else if(curSquare.piece == null){
                actions.push({
                    type: "move",
                    square: curSquare
                });
            } else {
                //TODO: Error? Shouldn't ordinarily be possible
            }
        });
        return actions;
    }
}

class Knight extends RelativeMover {
    constructor(color){
        super(color);
        this.deltas = [
            [2,1],
            [2,-1],
            [-2,1],
            [-2,-1],
            [1,2],
            [1,-2],
            [-1,2],
            [-1,-2]
        ];
        this.src = "/Chess/pieces/knight_"+this.color+".png";
    }
}

class King extends Piece { //Does not extend RelativeMover because the only RelativeMover method was overridden because of castling
    constructor(color){
        super(color);
        this.moved = false;
        this.deltas = [
            [1,0],
            [-1,0],
            [0,1],
            [0,-1],
            [1,1],
            [1,-1],
            [-1,1],
            [-1,-1]
        ];
        this.src = "/Chess/pieces/king_"+this.color+".png";
    }

    getValidActions(){ //Similar to the RelativeMover; wish I could super() method calls so I could just extend this instead of repeating it here
        if(this.captured){return [];}
        var actions = [];
        this.deltas.forEach((delta)=>{
            var curSquare = this.getRel(delta[0], delta[1]);
            if(curSquare == null){
                //Do nothing
            } else if(curSquare.piece != null && curSquare.piece.color != this.color){
                actions.push({
                    type: "capture",
                    square: curSquare
                });
            } else if(curSquare.piece == null){
                actions.push({
                    type: "move",
                    square: curSquare
                });
            } else {
                //TODO: Error? Shouldn't ordinarily be possible
            }
        });
        if(!this.moved){
            //TODO: Castling
        }
        return actions;
    }

    moveTo(x,y){
        if(this.board[y][x].piece){
            this.board[y][x].piece.capture();
        }
        this.getRel(0,0).piece = null;
        this.board[y][x].piece = this;
        this.moved = true; //Track movement for castling
    }
}

class Square {
    constructor(){
        //Literally an empty class lol
    }
}