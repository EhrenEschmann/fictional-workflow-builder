import { Command } from './command';
import { QueryBus } from '../../services/query-bus.service';
import { AggregateFactory } from '../../services/aggregate-factory.service';
import { TypeStore } from '../../services/type-store.service';
import { WorkflowAggregate } from '../domain/workflow-aggregates/workflowAggregate';
import { CommandType } from '../command-domain/commandType';

export class DeleteWorkflowAggregateCommand extends Command {
    private originalIndex: number;
    type = CommandType.Delete;

    constructor(
        public targetHash: string
    ) { super(); }

    execute = (fork: number, queryBus: QueryBus, aggregateFactory: AggregateFactory) => {
        let aggregate = queryBus.getAggregateRoot(fork, this.targetHash) as WorkflowAggregate;
        this.originalIndex = aggregate.parent.indexOf(aggregate);
        if(this.originalIndex === -1)
            throw new Error('aggregate not part of workflow');
        aggregate.parent.splice(this.originalIndex, 1);

        this.title = `Delete ${aggregate.getHash()}`;
    }

    undo = (fork: number, queryBus: QueryBus, aggregateFactory: AggregateFactory) => {
        let aggregate = queryBus.getAggregateRoot(fork, this.targetHash) as WorkflowAggregate;
        aggregate.parent.splice(this.originalIndex, 0, aggregate);
    }


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