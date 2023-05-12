class Game {
    constructor(){
        this.room = null; //Will be set later, once the game's room is created
    }

    get uuid(){
        return this.room ? this.room.uuid : null;
    }

    set uuid(value){
        if(this.room){
            this.room.uuid = value;
        } //else fail silently
    }

    get name(){
        return this.room ? this.room.name : '';
    }

    set name(value){
        if(this.room){
            this.room.name = value;
        } //else fail silently
    }

    get players(){
        return this.room ? this.room.players : [];
    }

    set players(value){
        if(this.room){
            this.room.players = value;
        } //else fail silently
    }

    get server(){
        return this.room ? this.room.server : null;
    }

    set server(value){
        if(this.room){
            this.room.server = value;
        } //else fail silently
    }

    get type(){
        return this.constructor.name;
    }
}

module.exports = Game;
