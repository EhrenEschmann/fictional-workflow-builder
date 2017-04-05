import { Command } from '../commands/command';
import { CommandType } from '../command-domain/commandType';

export class CommandConflict {
    constructor(
        public fromCommand: Command,
        public toCommand: Command
    ) { }

    getAggregate = (): string => {
        return this.fromCommand.aggregateHash();
    }

    getType = (): string => {
        return CommandType[this.fromCommand.type];
    }

    getFromValue = (): string => {
        return this.fromCommand.getValue();
    }

    getToValue = (): string => {
        return this.toCommand.getValue();
    }
}