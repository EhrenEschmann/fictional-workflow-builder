import { Command } from './command';
import { FutureTargetSettableCommand } from './futureTargetSettableCommand';
import { QueryBus } from '../../services/query-bus.service';
import { AggregateFactory } from '../../services/aggregate-factory.service';
import { TypeStore } from '../../services/type-store.service';
import { CommandType } from '../command-domain/commandType';

export class CreateNewWorkflowAggregateCommand extends Command {

    type = CommandType.Create;

    constructor(
        public aggregateType: string,
        public targetHash: string,
        public updateCommands: Array<FutureTargetSettableCommand> = []
    ) { super(); }

    execute = (fork: number, queryBus: QueryBus, aggregateFactory: AggregateFactory) => {
        aggregateFactory.createAggregateByType(this.aggregateType, fork, this.targetHash);

        for (let command of this.updateCommands) {
            command.setTarget(this.targetHash);
            command.execute(fork, queryBus, aggregateFactory);
        }

        this.title = `Creating new ${this.aggregateType} ${this.targetHash}`;
    }

    undo = (fork: number, queryBus: QueryBus, aggregateFactory: AggregateFactory) => {
        for (let j = this.updateCommands.length - 1; j >= 0; j--) {
            this.updateCommands[j].undo(fork, queryBus, aggregateFactory);
        }
        aggregateFactory.invalidateCache(fork, this.targetHash);
    }

    aggregateHash = (): string => {
        return this.targetHash;
    }

    getValue = (): string => {
        return 'Create';
    }

    toJSON() {
        return {
            __type__: this.__type__,
            aggregateType: this.aggregateType,
            targetHash: this.targetHash,
            updateCommands: this.updateCommands
        };
    }
}

TypeStore.put(CreateNewWorkflowAggregateCommand.prototype.constructor.name, CreateNewWorkflowAggregateCommand);