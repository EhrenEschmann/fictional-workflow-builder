import { Command } from './command';
import { FutureTargetSettableCommand } from './futureTargetSettableCommand';
import { QueryBus } from '../../services/query-bus.service';
import { AggregateFactory } from '../../services/aggregate-factory.service';
import { TypeStore } from '../../services/type-store.service';
import { WorkflowAggregate } from '../domain/workflow-aggregates/workflowAggregate';
import { CommandType } from "../command-domain/commandType";

export class DeleteWorkflowAggregateCommand extends Command {

    constructor(
        public targetHash: string
    ) { super(); }

    private originalIndex: number;
    execute = (fork: number, queryBus: QueryBus, aggregateFactory: AggregateFactory) => {
        var aggregate = queryBus.getAggregateRoot(fork, this.targetHash) as WorkflowAggregate;
        this.originalIndex = aggregate.parent.indexOf(aggregate);
        aggregate.parent.splice(this.originalIndex, 1);

        this.title = `Delete ${aggregate.getHash()}`;
    }

    undo = (fork: number, queryBus: QueryBus, aggregateFactory: AggregateFactory) => {
        var aggregate = queryBus.getAggregateRoot(fork, this.targetHash) as WorkflowAggregate;
        aggregate.parent.splice(this.originalIndex, 0, aggregate);
    }

    type = CommandType.Delete;

    aggregateHash = (): string => {
        return this.targetHash;
    }

    toJSON() {
        return {
            __type__: this.__type__,
            targetHash: this.targetHash
        };
    }
}

TypeStore.put(DeleteWorkflowAggregateCommand.prototype.constructor.name, DeleteWorkflowAggregateCommand);