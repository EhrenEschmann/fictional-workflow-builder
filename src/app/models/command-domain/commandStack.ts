import { Command } from "../commands/command";

export class CommandStack {

    private stack: Array<Command>;
    private location: number;
    
    constructor() {
        this.stack = [];
    }

    push = (command: Command): void => {
        for (let i = 0; i < this.location; i++)
            this.stack.pop();
        this.location = 0;
        this.stack.push(command);
    }

    unPop = (): Command => {
        this.location--;
        return this.stack[this.getLength() - 1];
    }

    pop = (): Command => {
        var command = this.stack[this.getLength() - 1];
        this.location++;
        return command;
    }

    getLength = (): number => {
        return this.stack.length - this.location;
    }

    getLocation = (): number => {
        return this.location; 
    }

    getArchive = (): Array<Command> => {
        return this.stack;
    }
}