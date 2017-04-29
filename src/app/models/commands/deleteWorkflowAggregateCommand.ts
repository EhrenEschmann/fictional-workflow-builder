import { Command } from './command';
import { QueryBus } from '../../services/query-bus.service';
import { TypeStoreFactory } from '../../services/type-store-factory.service';
import { TypeStore } from '../../services/type-store.service';
import { WorkflowAggregate } from '../domain/workflow-aggregates/workflowAggregate';
import { CommandType } from '../command-domain/commandType';

export class DeleteWorkflowAggregateCommand extends Command {
    private originalIndex: number;
    type = CommandType.Delete;

    constructor(
        public targetHash: string
    ) { super(); }

    execute = (realityId: number, queryBus: QueryBus, typeStoreFactory: TypeStoreFactory) => {
        let aggregate = queryBus.getAggregateRoot(realityId, this.targetHash) as WorkflowAggregate;
        this.originalIndex = aggregate.parent.indexOf(aggregate);
        if (this.originalIndex === -1)
            throw new Error('aggregate not part of workflow');
        aggregate.parent.splice(this.originalIndex, 1);

        this.title = `Delete ${aggregate.getHash()}`;
    }

    undo = (realityId: number, queryBus: QueryBus, typeStoreFactory: TypeStoreFactory) => {
        let aggregate = queryBus.getAggregateRoot(realityId, this.targetHash) as WorkflowAggregate;
        aggregate.parent.splice(this.originalIndex, 0, aggregate);
    }

    aggregateHash = (): string => {
        return this.targetHash;
    }

    getValue = (): string => {
        return 'Delete';
    }

    clone = (): Command => {
        return new DeleteWorkflowAggregateCommand(this.targetHash);
    }

    toJSON() {
        return {
            __type__: this.__type__,
            targetHash: this.targetHash
        };
    }
}

TypeStore.put(DeleteWorkflowAggregateCommand);