import { Command } from "../commands/command";
import { CreateNewWorkflowAggregateCommand } from "../commands/createNewWorkflowAggregateCommand";
import { MoveWorkflowAggregateToRootCommand } from "../commands/moveWorkflowAggregateToRootCommand";
import { MoveWorkflowAggregateToTargetCommand } from "../commands/moveWorkflowAggregateToTargetCommand";
import { MoveCommand } from "../commands/moveCommand";
import { CommandType } from "../command-domain/commandType";
import { Dictionary } from "../collections/dictionary";
import { UpdatePropertyCommand } from "../commands/updatePropertyCommand";

export class AggregateCommandPartition {

    private createCommand: CreateNewWorkflowAggregateCommand;
    private moveCommands: Array<Command> = [];
    private updateCommands: Array<UpdatePropertyCommand> = [];
    private deleteCommand: Command;

    constructor(
        public readonly hash: string,
        public readonly order: number
    ) { }

    getHash = (): string => {
        return this.hash;
    }

    getParentAggregateHash = (): string => {
        var lastMove = this.moveCommands[this.moveCommands.length - 1] as any;
        return lastMove.getNewParentHash();
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
    }

    addDeleteCommand = (command: Command): void => {
        this.deleteCommand = command;
    }

    consolidateUpdates = (): void => {
        var lookup: Dictionary<UpdatePropertyCommand> = {};
        for (let command of this.updateCommands) {
            lookup[command.propertyKey] = command;
        }

        var consolidated: Array<UpdatePropertyCommand> = [];
        for (let key in lookup) {
            consolidated.push(lookup[key]);
        }
        this.updateCommands = consolidated;
    }

    getOrderedCommands = (): Array<Command> => {
        var commands: Array<Command> = [];
        if (this.createCommand)
            commands.push(this.createCommand);
        if (this.moveCommands.length > 0)
            commands.push(this.moveCommands[this.moveCommands.length - 1])
        if (this.updateCommands.length > 0)
            commands = commands.concat(this.updateCommands);
        if (this.deleteCommand)
            commands.push(this.deleteCommand);

        return commands;
    }
}