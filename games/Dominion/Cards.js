const { ActionGroup, Action } = require('./Stack.js');

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

/*
Primitive actions:
- look at, reveal
- do something for each player, or for each other player
+ play card, replay card -- only need "play" + card references
+ reorder cards (eg. in Sentry when putting two cards back, you reorder the looked-at cards before topdecking them) -- only need to reorder when putting on deck?
- odd ones out:
  - +1 the first time you play a silver
  - repeat (for Library)
*/

const prim = {
    money: (amount = 1)=>{
        return new Action('plusMoney', [amount]);
    },
    cards: (amount = 1)=>{
        return new Action('plusCards', [amount]);
    },
    actions: (amount = 1)=>{
        return new Action('plusActions', [amount]);
    },
    buys: (amount = 1)=>{
        return new Action('plusBuys', [amount]);
    },

    select: (amountType = 'exactly', amount = 1, location = 'hand', condition = (()=>(true)))=>{
        return new Action('selectCards', [amountType, amount, location, condition]);
    },
    discardSelection: (selection = { cards:[], location:'hand' })=>{
        return new Action('moveCards', [selection, 'discardPile']);
    },
    trashSelection: (selection = { cards:[], location:'hand' })=>{
        return new Action('moveCards', [selection, 'trashMat']);
    },
    gainSelection: (selection = { cards:[], location:'supply' }, toLocation = 'discard')=>{
        return new Action('moveCards', [selection, toLocation]);
    },
    topdeckSelection: (selection = { cards:[], location:'hand' })=>{
        return new Action('moveCards', [selection, 'deck']);
    },

    getInfo: (query = ()=>(0))=>{
        return new Action('getInfo', [query]);
    },
    confirm: (prompt = '', yes = [], no = [])=>{
        return new Action('choice', [prompt, {text:'Yes', action:yes}, {text:'No', action:no}]);
    },
    allOtherPlayers: ()=>{
        
    }
};

prim.discard = (amountType = 'exactly', amount = 1, condition = (()=>(true)), fromLocation = 'hand')=>{
    let select = prim.select(amountType, amount, fromLocation, condition);
    let discard = prim.discardSelection({action:select, property:'selection'});
    return [select, discard];
};
prim.trash = (amountType = 'exactly', amount = 1, condition = (()=>(true)), fromLocation = 'hand')=>{
    let select = prim.select(amountType, amount, fromLocation, condition);
    let trash = prim.trashSelection({action:select, property:'selection'});
    return [select, trash];
};
prim.gain = (amountType = 'exactly', amount = 1, condition = (()=>(true)), fromLocation = 'supply', toLocation = 'discard')=>{
    let select = prim.select(amountType, amount, fromLocation, condition);
    let gain = prim.gainSelection({action:select, property:'selection'}, toLocation);
    return [select, gain];
};
prim.topdeck = (amountType = 'exactly', amount = 1, condition = (()=>(true)), fromLocation = 'hand')=>{
    let select = prim.select(amountType, amount, fromLocation, condition);
    let topdeck = prim.topdeckSelection({action:select, property:'selection'});
    return [select, topdeck];
};
prim.cantrip = ()=>{
    return [prim.cards(1), prim.actions(1)];
}


//////////////////////////////////////////////////////////////////////////////////////////


var cardsGlobal = {

    //Base cards
    'Copper': {
        name: 'Copper',
        cost: 0,
        types: ['Treasure'],
        play: ()=>{
            return [
                prim.money(1)
            ];
        }
    },
    'Silver': {
        name: 'Silver',
        cost: 3,
        types: ['Treasure'],
        play: ()=>{
            return [
                prim.money(2)
            ];
        }
    },
    'Gold': {
        name: 'Gold',
        cost: 6,
        types: ['Treasure'],
        play: ()=>{
            return [
                prim.money(3)
            ];
        }
    },
    'Estate': {
        name: 'Estate',
        cost: 2,
        types: ['Victory'],
        play: ()=>{
            return [];
        }
    },
    'Duchy': {
        name: 'Duchy',
        cost: 5,
        types: ['Victory'],
        play: ()=>{
            return [];
        }
    },
    'Province': {
        name: 'Province',
        cost: 8,
        types: ['Victory'],
        play: ()=>{
            return [];
        }
    },
    'Curse': {
        name: 'Curse',
        cost: 0,
        types: ['Curse'],
        play: ()=>{
            return [];
        }
    },

    //$2 cards
    'Cellar': {
        name: 'Cellar',
        cost: 2,
        types: ['Action'],
        play: ()=>{
            let select = prim.select('any');
            let discard = prim.discardSelection({action:select, property:'selection'});
            let draw = prim.cards({action:select, property:'selectedAmount'});
            return [
                prim.actions(1),
                select,
                discard,
                draw
            ];
        }
    },
    'Chapel': {
        name: 'Chapel',
        cost: 2,
        types: ['Action'],
        play: ()=>{
            return [
                prim.trash('upto', 4)
            ];
        }
    },
    'Moat': {
        name: 'Moat',
        cost: 2,
        types: ['Action', 'Reaction'],
        play: ()=>{
            return [
                prim.cards(2)
            ];
        },
        react: {} //TODO
    },

    //$3 cards
    'Harbinger': {
        name: 'Harbinger',
        cost: 3,
        types: ['Action'],
        play: ()=>{
            return [
                prim.cantrip(),
                prim.topdeck('upto', 1, ()=>(true), 'discard')
            ];
        }
    },
    'Merchant': {
        name: 'Merchant',
        cost: 3,
        types: ['Action'],
        play: ()=>{
            return [
                prim.cantrip(),
                //TODO: +1 the first time you play a silver
            ];
        }
    },
    'Vassal': {
        name: 'Vassal',
        cost: 3,
        types: ['Action'],
        play: ()=>{
            return [];
        }, //TODO: money(2), discard('exactly', 1, ()=>(true), 'deck'), ... ?
        'TODO': [
            //Earn 2 money
            //Discard 1 card from deck, save to "discarded"
            //If "discarded" was an action, choice: "play", "ignore"
        ]
    },
    'Village': {
        name: 'Village',
        cost: 3,
        types: ['Action'],
        play: ()=>{
            return [
                prim.cards(1),
                prim.actions(2)
            ];
        }
    },
    'Workshop': {
        name: 'Workshop',
        cost: 3,
        types: ['Action'],
        play: ()=>{
            return [
                prim.gain('exactly', 1, (card)=>(card.cost <= 4))
            ];
        }
    },

    //$4 cards
    'Bureaucrat': {
        name: 'Bureaucrat',
        cost: 4,
        types: ['Action', 'Attack'],
        play: ()=>{ //TODO
            return [

            ];
        },
        'TODO':[
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
        play: ()=>{
            return [];
        }
    },
    'Militia': {
        name: 'Militia',
        cost: 4,
        types: ['Action', 'Attack'],
        play: ()=>{ //TODO
            return [

            ];
        },
        'TODO':[
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
        play: ()=>{
            let select = prim.select('exactly', 1, 'hand', (card)=>(card.name === 'Copper'));
            let trash = prim.trashSelection({action:select, property:'selection'});
            let earn = prim.if({action:trash, property:'successful'}, prim.money(3), []);
            return [
                prim.confirm('', [select, trash, earn]) //TODO: Text
            ];
        }
    },
    'Poacher': {
        name: 'Poacher',
        cost: 4,
        types: ['Action'],
        play: ()=>{
            let getEmptyPiles = prim.getInfo((game)=>(
                game.state.kingdom.piles.filter(pile => pile.amount === 0).length
            ));
            let discardThatManyCards = prim.discard('exactly', {action:getEmptyPiles, property:'result'});
            return [
                prim.cantrip(),
                prim.money(1),
                getEmptyPiles,
                discardThatManyCards
            ];
        }
    },
    'Remodel': {
        name: 'Remodel',
        cost: 4,
        types: ['Action'],
        play: ()=>{
            let selectAndTrash = prim.trash('exactly', 1);
            let gainUpgradedCard = prim.gain('exactly', 1, (card)=>(card.cost <= selectAndTrash[1].trashedCost + 2)) //TODO: Is this allowed? Will it work?
            return [
                selectAndTrash,
                gainUpgradedCard
            ];
        }
    },
    'Smithy': {
        name: 'Smithy',
        cost: 4,
        types: ['Action'],
        play: ()=>{
            return [
                prim.cards(3)
            ];
        }
    },
    'Throne Room': {
        name: 'Throne Room',
        cost: 4,
        types: ['Action'],
        play: ()=>{
            let select = prim.select('exactly', 1, 'hand', (card)=>(card.types.includes('Action')));
            let play = prim.play({action:select, property:'selection'});
            let replay = prim.play({action:select, property:'selection'}); //TODO: This will only work once card references are implemented properly (or we could use a special "replay" action)
            return [
                prim.confirm('', [ //TODO: Change to "select up to 1" or normalize Harbinger to be like this one
                    select,
                    play,
                    replay
                ])
            ];
        }
    },

    //$5 cards
    'Bandit': {
        name: 'Bandit',
        cost: 5,
        types: ['Action', 'Attack'],
        play: ()=>{ //TODO
            return [

            ];
        },
        'TODO':[
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
        play: ()=>{
            return [
                prim.cards(4),
                prim.buys(1),
                //TODO: Each other player: Draw 1 card
            ];
        }
    },
    'Festival': {
        name: 'Festival',
        cost: 5,
        types: ['Action'],
        play: ()=>{
            return [
                prim.actions(2),
                prim.buys(1),
                prim.money(2)
            ];
        }
    },
    'Laboratory': {
        name: 'Laboratory',
        cost: 5,
        types: ['Action'],
        play: ()=>{
            return [
                prim.cards(2),
                prim.actions(1)
            ];
        }
    },
    'Library': {
        name: 'Library',
        cost: 5,
        types: ['Action'],
        play: ()=>{ //TODO
            return [

            ];
        },
        'TODO':[
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
        play: ()=>{
            return [
                prim.cards(1),
                prim.actions(1),
                prim.buys(1),
                prim.money(1)
            ];
        }
    },
    'Mine': {
        name: 'Mine',
        cost: 5,
        types: ['Action'],
        play: ()=>{ //TODO
            return [

            ];
        },
        'TODO':[
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
        play: ()=>{ //TODO
            return [

            ];
        },
        'TODO':[
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
        play: ()=>{
            return [
                prim.cards(2),
                //TODO: Each other player: Gain a curse
            ];
        }
    },

    //$6 cards
    'Artisan': {
        name: 'Artisan',
        cost: 6,
        types: ['Action'],
        play: ()=>{
            return [
                prim.gain('exactly', 1, (card)=>(card.cost <= 5), 'supply', 'hand'),
                prim.topdeck('exactly', 1)
            ];
        }
    },
};

module.exports = cardsGlobal;
