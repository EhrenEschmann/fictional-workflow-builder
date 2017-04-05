import { Command } from '../commands/command';
import { CreateNewWorkflowAggregateCommand } from '../commands/createNewWorkflowAggregateCommand';
import { Dictionary } from '../collections/dictionary';
import { UpdatePropertyCommand } from '../commands/updatePropertyCommand';

export class ConsolidatedAggregateCommandPartition {
    constructor(
        public createCommand: CreateNewWorkflowAggregateCommand,
        public moveCommand: Command,
        public updateCommands: Dictionary<UpdatePropertyCommand>,
        public deleteCommand: Command
    ) { }

    getOrderedCommands = (): Array<Command> => {
        let commands: Array<Command> = [];
        if (this.createCommand)
            commands.push(this.createCommand);
        if (this.moveCommand)
            commands.push(this.moveCommand);
        for (let hash in this.updateCommands) {
            if (this.updateCommands.hasOwnProperty(hash)) {
                if (this.updateCommands[hash])
                    commands.push(this.updateCommands[hash]);
            }
        }
        // if (this.updateCommands.length > 0)
        //     commands = commands.concat(this.updateCommands);
        if (this.deleteCommand)
            commands.push(this.deleteCommand);

        return commands;
    }
}

export class AggregateCommandPartition {

    private createCommand: CreateNewWorkflowAggregateCommand;
    private moveCommands: Array<Command> = [];
    private updateCommands: Array<UpdatePropertyCommand> = [];
    private deleteCommand: Command;

    private updateCommandLookup: Dictionary<UpdatePropertyCommand>;

    constructor(
        public readonly hash: string,
        public readonly order: number
    ) {
        this.updateCommandLookup = {};
    }

    getHash = (): string => {
        return this.hash;
    }

    getParentAggregateHash = (): string => {
        let lastMove = this.moveCommands[this.moveCommands.length - 1] as any;
        if (!lastMove) return undefined;
        return lastMove.getNewParentHash();
    }

    created = () => {
        return !!this.createCommand;
    }

    deleted = () => {
        return !!this.deleteCommand;
    }

    addCreateCommand = (command: CreateNewWorkflowAggregateCommand): void => {
        this.createCommand = command;
    }

    addMoveCommand = (command: Command): void => {
        this.moveCommands.push(command);
    }

    addUpdateCommand = (command: UpdatePropertyCommand): void => {
        this.updateCommands.push(command);
        this.updateCommandLookup[command.propertyKey] = command;
    }

    addDeleteCommand = (command: Command): void => {
        this.deleteCommand = command;
    }

    clearUpdates = (): void => {
        this.updateCommands = [];
    }

    clearMoves = (): void => {
        this.moveCommands = [];
    }

    getUpdateCommandLookup = (): Dictionary<UpdatePropertyCommand> => {
        return this.updateCommandLookup;
    }

    getLastMoveCommand = (): Dictionary<UpdatePropertyCommand> => {
        return this.updateCommandLookup;
    }

    getConsolidated = (): ConsolidatedAggregateCommandPartition => {
        return new ConsolidatedAggregateCommandPartition(this.createCommand,
            this.moveCommands[this.moveCommands.length - 1],
            this.updateCommandLookup,
            this.deleteCommand
        );
    }

    // private consolidateUpdates(): void {
    //     let consolidated: Array<UpdatePropertyCommand> = [];
    //     for (let key in this.updateCommandLookup) {
    //         consolidated.push(this.updateCommandLookup[key]);
    //     }
    //     this.updateCommands = consolidated;
    // }

    // consolidate = (): void => {
    //     this.consolidateUpdates();
    //     this.moveCommands.splice(0,)
    // }

    getOrderedCommands = (): Array<Command> => {
        let commands: Array<Command> = [];
        if (this.createCommand)
            commands.push(this.createCommand);
        if (this.moveCommands.length > 0)
            commands.push(this.moveCommands[this.moveCommands.length - 1]);
        if (this.updateCommands.length > 0)
            commands = commands.concat(this.updateCommands);
        if (this.deleteCommand)
            commands.push(this.deleteCommand);

        return commands;
    }
}