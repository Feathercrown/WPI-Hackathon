const Game = require('../../common/Game.js');
const Stack = require('./Stack.js');

class TicTacToe extends Game {
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
            stack: new Stack()
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
        this.state.stack.addGroup('card', card.name, card.play);
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

module.exports = { game: TicTacToe, translators }; //TODO: Just attach the translators to the game itself, don't keep track of them separately?


/*
{
    card: 'Copper',
    count: 60
},
{
    card: 'Silver',
    count: 40
},
{
    card: 'Gold',
    count: 30
}
*/

//TODO
var cardsGlobal = {

    //Base cards
    'Copper': {
        name: 'Copper',
        cost: 0,
        types: ['Treasure'],
        play: [
            //Earn 1 money
        ]
    },
    'Silver': {
        name: 'Silver',
        cost: 3,
        types: ['Treasure'],
        play: [
            //Earn 2 money
        ]
    },
    'Gold': {
        name: 'Gold',
        cost: 6,
        types: ['Treasure'],
        play: [
            //Earn 3 money
        ]
    },
    'Estate': {
        name: 'Estate',
        cost: 2,
        types: ['Victory'],
        play: []
    },
    'Duchy': {
        name: 'Duchy',
        cost: 5,
        types: ['Victory'],
        play: []
    },
    'Province': {
        name: 'Province',
        cost: 8,
        types: ['Victory'],
        play: []
    },
    'Curse': {
        name: 'Curse',
        cost: 0,
        types: ['Curse'],
        play: []
    },

    //$2 cards
    'Cellar': {
        name: 'Cellar',
        cost: 2,
        types: ['Action'],
        play: [
            //Add 1 action
            //Select any number of cards, save to "selected"
            //Discard "selected"
            //Draw "selected".length
        ]
    },
    'Chapel': {
        name: 'Chapel',
        cost: 2,
        types: ['Action'],
        play: [
            //Select up to 4 cards, save to "selected"
            //Trash "selected"
        ]
    },
    'Moat': {
        name: 'Moat',
        cost: 2,
        types: ['Action', 'Reaction'],
        play: [
            //Draw 2 cards
        ]
    },

    //$3 cards
    'Harbinger': {
        name: 'Harbinger',
        cost: 3,
        types: ['Action'],
        play: [
            //Draw 1 card
            //Add 1 action
            //Select up to 1 card from discard
            //Put selected on deck
        ]
    },
    'Merchant': {
        name: 'Merchant',
        cost: 3,
        types: ['Action'],
        play: [
            //Draw 1 card
            //Add 1 action
            //+1 the first time you play a silver
        ]
    },
    'Vassal': {
        name: 'Vassal',
        cost: 3,
        types: ['Action'],
        play: [
            //Earn 2 money
            //Discard 1 card from deck, save to "discarded"
            //If "discarded" was an action, choice: "play", "ignore"
        ]
    },
    'Village': {
        name: 'Village',
        cost: 3,
        types: ['Action'],
        play: [
            //Draw 1 card
            //Add 2 actions
        ]
    },
    'Workshop': {
        name: 'Workshop',
        cost: 3,
        types: ['Action'],
        play: [
            //Choose a card from the supply (restrictions: cost <= 4), save to "chosen"
            //Gain that card
        ]
    },

    //$4 cards
    'Bureaucrat': {
        name: 'Bureaucrat',
        cost: 4,
        types: ['Action', 'Attack'],
        play: [
            //Gain a silver to your deck
            //Each other player:
            //  If hand has a victory card:
            //    Select card from hand (restriction: types contains "victory"), save to "selected"
            //    Reveal "selected"
            //    Put "selected" on deck
            //  Else:
            //    Reveal hand
        ]
    },
    'Gardens': {
        name: 'Gardens',
        cost: 4,
        types: ['Victory'],
        play: []
    },
    'Militia': {
        name: 'Militia',
        cost: 4,
        types: ['Action', 'Attack'],
        play: [
            //Earn 2 money
            //Each other player:
            //  Chooses all but three cards from their hand
            //  Discards those cards
        ]
    },
    'Moneylender': {
        name: 'Moneylender',
        cost: 4,
        types: ['Action'],
        play: [
            //Choice:
            //  Do nothing
            //  Trash a copper from your hand, save to "trashed", if "trashed" then earn 3 money
        ]
    },
    'Poacher': {
        name: 'Poacher',
        cost: 4,
        types: ['Action'],
        play: [
            //Draw a card
            //Add an action
            //Earn 1 money
            //Discard [empty supply piles] cards
        ]
    },
    'Remodel': {
        name: 'Remodel',
        cost: 4,
        types: ['Action'],
        play: [
            //Select a card, save to "trashed"
            //Trash "trashed"
            //Select a card from the supply (restrictions: cost <= trashed.cost + 2), save to "selected"
            //Gain "selected"
        ]
    },
    'Smithy': {
        name: 'Smithy',
        cost: 4,
        types: ['Action'],
        play: [
            //Draw 3 cards
        ]
    },
    'Throne Room': {
        name: 'Throne Room',
        cost: 4,
        types: ['Action'],
        play: [
            //Choice:
            //  Do nothing
            //  Select a card from your hand (restrictions: types contains "action"), play "selected", replay "selected"
        ]
    },

    //$5 cards
    'Bandit': {
        name: 'Bandit',
        cost: 5,
        types: ['Action', 'Attack'],
        play: [
            //Gain a gold
            //Each other player:
            //  Reveal the top 2 cards of your deck
            //  Select 1 card from revealed (restrictions: types contains "treasure", card name !== "Copper"), save to "selected"
            //  Trash "selected"
            //  Discard revealed
        ]
    },
    'Council Room': {
        name: 'Council Room',
        cost: 5,
        types: ['Action'],
        play: [
            //Draw 4 cards
            //Add 1 buy
            //Each other player: Draw 1 card
        ]
    },
    'Festival': {
        name: 'Festival',
        cost: 5,
        types: ['Action'],
        play: [
            //Add 2 actions
            //Add 1 buy
            //Earn 2 money
        ]
    },
    'Laboratory': {
        name: 'Laboratory',
        cost: 5,
        types: ['Action'],
        play: [
            //Draw 2 cards
            //Add 1 action
        ]
    },
    'Library': {
        name: 'Library',
        cost: 5,
        types: ['Action'],
        play: [
            //Repeat until (hand size >= 7) or (deck is empty && discard is empty): (TODO: -1 card token when both are empty breaks this, really you draw until drawing does nothing?)
            //  Look at 1 card
            //  If card is an action:
            //    Choice: Set it aside, or draw it
            //  Else:
            //    Draw it
            //Discard any set-aside cards
        ]
    },
    'Market': {
        name: 'Market',
        cost: 5,
        types: ['Action'],
        play: [
            //Draw 1 card
            //Add 1 action
            //Add 1 buy
            //Earn 1 money
        ]
    },
    'Mine': {
        name: 'Mine',
        cost: 5,
        types: ['Action'],
        play: [
            //Choice:
            //  Do nothing
            //  [
            //    Select a card from your hand (restrictions: types contains "treasure"), save to "trashed"
            //    Trash "trashed"
            //    Select a card from the supply (restrictions: types contains "treasure", cost <= trashed.cost + 3), save to "selected"
            //    Gain "selected" to your hand
            //  ]
        ]
    },
    'Sentry': {
        name: 'Sentry',
        cost: 5,
        types: ['Action'],
        play: [
            //Look at 2 cards from your deck
            //Select any number of cards
            //Trash selected
            //Select any number of cards
            //Discard selected
            //Put the rest back on top in any order
        ]
    },
    'Witch': {
        name: 'Witch',
        cost: 5,
        types: ['Action', 'Attack'],
        play: [
            //Draw 2 cards
            //Each other player: Gain a curse
        ]
    },

    //$6 cards
    'Artisan': {
        name: 'Artisan',
        cost: 6,
        types: ['Action'],
        play: [
            //Select a card from the supply (restrictions: cost <= 5), save to "selected"
            //Gain "selected" to your hand
            //Select a card from your hand, save to "topdecked"
            //Put "topdecked" on top of your deck
        ]
    },
};

/*
Primitive actions:
- +card, +action, +buy, +money
- select cards from [location] with restrictions [list] (or, for the supply, select *piles*)
- discard, trash, gain, topdeck (all are methods that move cards between locations)
- get property (amount of selected, cost of card, card type, number of empty supply piles, etc.) (may be multiple functions?)
- save/retreive variables to be referred to within the context of that play of the card
- give choice
- if (sometimes based on a choice, but not always-- save choice to var and read it in "if"?)
- look at, reveal
- do something for each player, or for each other player
- play card, replay card
- reorder cards (eg. in Sentry when putting two cards back, you reorder the looked-at cards before topdecking them)
- repeat (for Library)
- odd ones out:
  - +1 the first time you play a silver
*/
