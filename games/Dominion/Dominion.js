const Game = require('../../common/Game.js');
const { ActionGroup, Action } = require('./Stack.js');
const cardsGlobal = require('./Cards.js');

class Dominion extends Game {
    constructor(){
        super();
        this.maxPlayers = 2; //TODO: Make this go up to 4; add game settings and start game stage -- maybe generalize it?
        this.ready = false; //Determines if players can submit new moves or not
        this.state = {
            turn: {
                number: 0,
                curPlayer: 0,
                phase: 0,
                question: null
            },
            winner: null,
            kingdom: {
                piles: [],
                trash: [] //TODO: Events etc.
            },
            players: [
                {
                    deck: [],
                    discard: [],
                    hand: []
                },
                {
                    deck: [],
                    discard: [],
                    hand: []
                },
                {
                    deck: [],
                    discard: [],
                    hand: []
                },
                {
                    deck: [],
                    discard: [],
                    hand: []
                }
            ],
            stack: new ActionGroup()
        };
    }

    start(){
        this.setup();
        this.ready = true;
        this.updatePlayers();
    }

    updatePlayers(){
        this.room.send(this.state); //TODO: This will need to be updated when animations are a thing
    }

    process(client, decision){
        if(!this.ready){return;} //TODO: Logging/error handling

        //TODO: Handle resignations etc. with even more priority than question answers

        //Handle question answers separately
        if(this.state.turn.question !== null){
            //TODO
        } else {
            if(this.players[this.state.turn.curPlayer] != client){return;} //TODO: There has to be a better way of getting the current player
            switch(decision.type){
                case 'playCard':
                    processPlayCard(decision.data);
                    break;
                case 'endPhase':
                    this.state.turn.phase++;
                    if(this.state.turn.phase === 2){ //Clean-Up
                        cleanUp();
                        this.state.turn.number++;
                        this.state.turn.phase = 0;
                        this.state.turn.curPlayer = (this.state.turn.curPlayer + 1) % 2; //TODO: This works for now
                    }
                    break;
                default:
                    console.error('[Game] Invalid decision type');
                    break;
            }
        }
        //this.updatePlayers();
    }

    processPlayCard(decisionData){
        let card = getCardDetails(decisionData.cardName);

        //Check for invalid phase
        if(this.state.turn.phase === 0 && !card.types.includes('Action')
        || this.state.turn.phase === 1 && !card.types.includes('Treasure')){
            //Invalid phase
        }

        //Check that the card is in their hand
        if(!getCurPlayer().hand.includes(card.name)){
            //Invalid card based on hand contents
        }

        //Play the card for real
        let curPlayer = this.state.turn.curPlayer;
        this.state.stack.addGroup('card', card.name, card.play(curPlayer).flat().forEach(action=>action.player = curPlayer)); //TODO: Ideally we'd pass the player into every action but that's so much passing stuff around, we can just set it in bulk here and pass it in so anything that needs it can use it
    }

    getCurPlayer(){
        return this.state.players[this.state.turn.curPlayer];
    }

    getCardDetails(cardName){
        let cards = cardsGlobal;

        if(cardName in cards){
            return cards[cardName];
        } else {
            //No card with that name exists
        }
    }
}

var translators = {};
translators.New_WS_Client = require('./translators/New_WS_Translator.js');
translators.CMD_Client = require('./translators/CMD_Translator.js');

module.exports = { game: Dominion, translators }; //TODO: Just attach the translators to the game itself, don't keep track of them separately?
