class Game {

    registry = {
        actions: {
            'chooseRPS': new Action(),
        }
    };
    rules = [
        new Rule('gameStart', true, 0, 'chooseRPS'),
    ];
    pieces = [];

    constructor(){

    }
}

class Piece {

    id = null;
    properties = {};

    constructor(){

    }
}

class Property {

}

class Action {

    args = []; //any[]
    parent = null; //Action
    reactions = []; //Action[]

    constructor(args){
        this.args = args;
    }

    do(){

    }
}

class ActionSequence extends Action {

    index = 0;
    actions = [];

    constructor(actions){
        this.actions = actions;
    }

    do(){

    }
}

class Modifier {

}

//Rules trigger on criteria and add an action.
//eg. "When a piece dies, its owner loses a point"
//or "When it is your turn, choose a piece and move it"
//Positive priority happens before the trigger, lower happens after.
//Larger priority numbers are further before/after.
//Priority 0 has special meaning. //TODO: 0 defines what an undefined action is?
class Rule {

    trigger = null; //TODO
    condition = null; //TODO
    priority = null; //number
    action = null; //Action

    constructor(trigger, condition, priority, action){
        this.trigger = trigger;
        this.condition = condition;
        this.priority = priority;
        this.action = action;
    }
}

module.exports = {
    Game: Game,
    Piece: Piece,
    Property: Property,
    Action: Action,
    ActionSequence: ActionSequence,
    Modifier: Modifier,
    Rule: Rule,
};
