import { CommandStack } from './commandStack';
import { Command } from '../commands/command';

export class CommandReality {

    private commands: CommandStack;
    private childrenRealities: Array<CommandReality>;
    private undoLimit: number = 0;
    // private merged: boolean;

    constructor(
        private readonly id: number,
        private archive?: Array<Command>,
        private parentReality?: CommandReality
    ) {
        if (!this.archive)
            this.archive = [];
        this.commands = new CommandStack();
        this.childrenRealities = [];
        // this.merged = false;
    }

    // wasMerged = (): boolean => {
    //     return this.merged;
    // }

    // disable = (): void => {
    //     this.merged = true;
    // }

    getId = (): number => {
        return this.id;
    }

    addChild = (reality: CommandReality): void => {
        this.childrenRealities.push(reality);
    }

    getParent = (): CommandReality => {
        return this.parentReality;
    }

    getChildren = (): Array<CommandReality> => {
        return this.childrenRealities;
    }

    getArchive = (): Array<Command> => {
        return this.archive;
    }

    setArchive = (archive: Array<Command>): void => {
        this.archive = archive;
    }

    getCurrent = (): Array<Command> => {
        return this.commands.getArchive();
    }
    // getStart = (): number => {
    //     return this.start;
    // }

    // setStart = (start: number) => {
    //     this.start = start;
    // }
    // getLength = (): number => {
    //     throw new Error("todo: get length of this stack + this.start + parent starts")
    //     //return this.commands.getLength(); 
    // }

    // setUndoLimit = (): void => {
    //     this.undoLimit = this.commands.getLength();
    // }

    getCurrentLength = (): number => {
        return this.commands.getLength();
    }

    getUndoLength = (): number => {
        return this.commands.getLength() - this.undoLimit;
    }

    getRedoLength = (): number => {
        return this.commands.getLocation();
    }

    storeCommand = (command: Command): void => {
        this.commands.push(command);
    }

    getUndoCommand = (): Command => {
        return this.commands.pop();
    }

    getRedoCommand = (): Command => {
        return this.commands.unPop();
    }

    // clearStack = (): void => {
    //     this.commands.clear();
    // }
}