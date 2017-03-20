import { Command } from "../commands/command";

export class CommandStack {

    private location: LinkedNode;

    constructor() { 
        var nullRoot = new LinkedNode();
        this.location = nullRoot;
    }

    push = (command: Command): void => {
        var node = new LinkedNode(command);
        node.previous = this.location;

        if(this.location)
            this.location.next = node;

        this.location = node;
    }

    unPop = (): Command => {
        this.location = this.location.next;
        return this.location.getCommand();
    }

    pop = (): Command => {
        var command = this.location.getCommand();
        this.location = this.location.previous;
        return command;
    }

    getLength = (): number => {
        var temp: LinkedNode = this.location;
        var count = 0;
        while (temp.getCommand() != undefined) {
            temp = temp.previous;
            count++;
        }
        return count;
    }

    getLocation = (): number => {
        var temp: LinkedNode = this.location;
        var count = -1;
        while (temp != undefined) {
            temp = temp.next;
            count++;
        }
        return count;
    }

    getArchive = (): Array<Command> => {
        var temp: LinkedNode = this.location;
        var archive: Array<Command> = [];
        while (temp.getCommand() != undefined) {
            archive.unshift(temp.getCommand());
            temp = temp.previous;
        }
        return archive;
    }
}

class LinkedNode {

    constructor(private readonly command?: Command) { }

    getCommand = () => {
        return this.command;
    }

    previous: LinkedNode;

    next: LinkedNode;
}