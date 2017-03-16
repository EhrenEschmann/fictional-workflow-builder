import { CommandStack } from "./commandStack";
import { Command } from "../commands/command";

export class CommandFork {

    private commands: CommandStack;

    constructor(private readonly start: number,
        private readonly forkFrom?: number) {
        this.commands = new CommandStack();
    }

    getLength = (): number => {
        return this.commands.getLength();
    }

    getUndoLength = (): number => {
        return this.getLength();
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

    getArchive = (): Array<Command> => {
        return this.commands.getArchive();
    }
}