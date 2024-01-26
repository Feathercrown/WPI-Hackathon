class ActionGroup {
    type = '';
    name = '';
    contents = [];
    variables = {};
    pointer = 0;
    parent = null;

    constructor(type, name, contents){
        this.type = type;
        this.name = name;
        this.contents = contents;
    }

    addAction(){
        let action = new Action();
        action.parent = this;
        this.contents.push(action);
    }

    addGroup(type, name, contents){
        let group = new ActionGroup(type, name, contents);
        group.parent = this;
        this.contents.push(group);
    }

    next(){
        let action = this.contents[this.pointer];

        if(action instanceof Action){
            action.execute();
            this.pointer++;
        } else if (action instanceof ActionGroup){
            action.next();
            if(action.done){
                this.pointer++;
            }
        }

        if(this.pointer >= this.contents.length){
            this.done = true;
        }
    }
}

class Action {
    type = '';
    args = [];
    parent = null;

    constructor(type, args){
        this.type = type;
        this.args = args;
    }

    execute(game){
        //TODO: How to handle this?
        console.log(type, args);
    }
}

module.exports = ActionGroup;
