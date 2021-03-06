import { FutureTargetSettableCommand } from './futureTargetSettableCommand';
import { QueryBus } from '../../services/query-bus.service';
import { TypeStoreFactory } from '../../services/type-store-factory.service';
import { Workflow } from '../domain/workflow';
import { WorkflowAggregate } from '../domain/workflow-aggregates/workflowAggregate';
import { TypeStore } from '../../services/type-store.service';
import { CommandType } from '../command-domain/commandType';
import { MoveCommand } from './moveCommand';
import { Command } from './command';

export class MoveWorkflowAggregateToRootCommand extends FutureTargetSettableCommand implements MoveCommand {
    private previousParent: Array<WorkflowAggregate>;
    private previousParentAggregate: WorkflowAggregate;
    private previousIndex: number;

    type = CommandType.Move;

    constructor(
        public movingHash?: string
    ) { super(); }

    execute = (realityId: number, queryBus: QueryBus, typeStoreFactory: TypeStoreFactory) => {
        let workflow = queryBus.getRootObject(realityId) as Workflow;
        let movingAggregate = queryBus.getAggregate(realityId, this.movingHash) as WorkflowAggregate;
        if (workflow.rootAggregate().indexOf(movingAggregate) !== -1)
            throw new Error('Aggregate Already exists at root');

        this.previousParent = movingAggregate.parent;
        this.previousParentAggregate = movingAggregate.parentAggregate;

        if (movingAggregate.parent) {
            this.previousIndex = movingAggregate.parent.indexOf(movingAggregate);
            movingAggregate.parent.splice(this.previousIndex, 1);
        }
        movingAggregate.setParent(undefined, workflow.rootAggregate());

        workflow.rootAggregate().push(movingAggregate);
        this.title = `moving ${this.movingHash} to main workflow`;
    }

    undo = (realityId: number, queryBus: QueryBus, typeStoreFactory: TypeStoreFactory) => {
        let movingAggregate = queryBus.getAggregate(realityId, this.movingHash) as WorkflowAggregate;
        let workflow = queryBus.getRootObject(realityId) as Workflow;
        let parentsChildren = workflow.rootAggregate();
        parentsChildren.splice(parentsChildren.indexOf(movingAggregate), 1);
        if (this.previousParent) {
            this.previousParent.splice(this.previousIndex, 0, movingAggregate);
        }
        movingAggregate.parent = this.previousParent;
    }

    setTarget = (hash: string) => {
        this.movingHash = hash;
    }

    aggregateHash = (): string => {
        return this.movingHash;
    }

    getNewParentHash = (): string => {
        return undefined;
    }

    getValue = (): string => {
        return 'Root';
    }

    clone = (): Command => {
        return new MoveWorkflowAggregateToRootCommand(this.movingHash);
    }

    toJSON() {
        return {
            __type__: this.__type__,
            movingHash: this.movingHash
        };
    }
}

TypeStore.put(MoveWorkflowAggregateToRootCommand);