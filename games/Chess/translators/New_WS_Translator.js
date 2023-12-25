const Translator = require('../../../common/Translator.js');

class New_WS_Translator extends Translator {
    constructor(room){
        super(room);
    }

    receive(client, msg){
        console.log("New WS translator received: "+msg);
        if(msg.type == 'gameLeave'){ //TODO: Handle more types of messages! Eg. chat!
            this.server.receive(client, msg);
        } else {
            this.game.process(client, msg.decision);
        }
    }

    send(client, msg){
        console.log("New WS translator sent: "+msg);

        //Process game data into a list of sprites and options for the client to view and respond to

        //Gather and Translate Sprites
        var tileWidth = 60; //In pixels. TODO: A (SHOULDN'T EVEN BE ON THE FRONTEND) (MAYBE SCALE IT ON THE FRONTEND?)
        var sprites = [];
        msg.state.board.forEach((row,i)=>row.forEach((square,j)=>{
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
        client.send({ //Can't send the entire gamestate-- only a snapshot. Need to determine how to do this generally, probably-- perhaps send images and positions to the client?? With shortcut actions they can take on those images?
            type: "gameStateUpdate",
            newState: {
                sprites: sprites
            }
        });

        //Gather and Translate Decisions
        var decisions = [];
        msg.state.board.forEach((row,i)=>row.forEach((square,j)=>{
            if(square.piece && square.piece.color == (msg.state.turn==0?"white":"black")){
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
        if(client == msg.players[msg.state.turn]){
            client.send({
                type: "decisionList",
                list: decisions
            });
        } else {
            client.send({
                type: "decisionList",
                list: []
            });
        }
    }
}

module.exports = New_WS_Translator;
