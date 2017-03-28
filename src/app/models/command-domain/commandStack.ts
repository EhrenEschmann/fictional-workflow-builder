import { Command } from '../commands/command';

export class CommandStack {

    private nullRoot: LinkedNode;
    private location: LinkedNode;


    constructor() {
        this.nullRoot = new LinkedNode();
        this.location = this.nullRoot;
    }

    push = (command: Command): void => {
        let node = new LinkedNode(command);
        node.previous = this.location;

        if (this.location)
            this.location.next = node;

        this.location = node;
    }

    unPop = (): Command => {
        this.location = this.location.next;
        return this.location.getCommand();
    }

    pop = (): Command => {
        let command = this.location.getCommand();
        this.location = this.location.previous;
        return command;
    }

    getLength = (): number => {
        let temp: LinkedNode = this.location;
        let count = 0;
        while (temp.getCommand() !== undefined) {
            temp = temp.previous;
            count++;
        }
        return count;
    }

    getLocation = (): number => {
        let temp: LinkedNode = this.location;
        let count = -1;
        while (temp !== undefined) {
            temp = temp.next;
            count++;
        }
        return count;
    }

    getArchive = (): Array<Command> => {
        let temp: LinkedNode = this.location;
        let archive: Array<Command> = [];
        while (temp.getCommand() !== undefined) {
            archive.unshift(temp.getCommand());
            temp = temp.previous;
        }
        return archive;
    }

    clear = (): void => {
        this.location = this.nullRoot;
        this.location.next = undefined;
    }
}

class LinkedNode {

    previous: LinkedNode;
    next: LinkedNode;

    constructor(private readonly command?: Command) { }

    getCommand = () => {
        return this.command;
    }
}