import { FutureTargetSettableCommand } from './futureTargetSettableCommand';
import { QueryBus } from '../../services/query-bus.service';
import { TypeStoreFactory } from '../../services/type-store-factory.service';
import { WorkflowAggregate } from '../domain/workflow-aggregates/workflowAggregate';
import { TypeStore } from '../../services/type-store.service';
import { CommandType } from '../command-domain/commandType';
import { MoveCommand } from './moveCommand';
import { Command } from './command';

export class MoveWorkflowAggregateToTargetCommand extends FutureTargetSettableCommand implements MoveCommand {
    private previousParent: Array<WorkflowAggregate>;
    private previousParentAggregate: WorkflowAggregate;
    private previousIndex: number;

    type = CommandType.Move;

    constructor(
        public parentHash: string,
        public parentEvent: string,
        public movingHash?: string
    ) { super(); }

    execute = (realityId: number, queryBus: QueryBus, typeStoreFactory: TypeStoreFactory) => {
        const parentAggregate = queryBus.getAggregateRoot(realityId, this.parentHash) as WorkflowAggregate;
        const movingAggregate = queryBus.getAggregateRoot(realityId, this.movingHash) as WorkflowAggregate;
        if (parentAggregate.events[this.parentEvent].indexOf(movingAggregate) !== -1)
            throw new Error(`Aggregate Already exists at ${this.parentHash}, ${this.parentEvent}`);

        this.previousParent = movingAggregate.parent;
        this.previousParentAggregate = movingAggregate.parentAggregate;

        if (movingAggregate.parent) {
            this.previousIndex = movingAggregate.parent.indexOf(movingAggregate);
            movingAggregate.parent.splice(this.previousIndex, 1);
        }

        let array = parentAggregate.events[this.parentEvent];
        movingAggregate.setParent(parentAggregate, array);

        array.push(movingAggregate);
        this.title = `moving ${this.movingHash} to ${parentAggregate.name}'s ${this.parentEvent} event`;
    }

    undo = (realityId: number, queryBus: QueryBus, typeStoreFactory: TypeStoreFactory) => {
        let movingAggregate = queryBus.getAggregateRoot(realityId, this.movingHash) as WorkflowAggregate;
        let parentsChildren = movingAggregate.parent;
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
        return this.parentHash;
    }

    getValue = (): string => {
        return `[${this.parentHash}][${this.parentEvent}]`;
    }

    clone = (): Command => {
        return new MoveWorkflowAggregateToTargetCommand(this.parentHash, this.parentEvent, this.movingHash);
    }

    toJSON() {
        return {
            __type__: this.__type__,
            movingHash: this.movingHash,
            parentHash: this.parentHash,
            parentEvent: this.parentEvent
        };
    }
}

TypeStore.put(MoveWorkflowAggregateToTargetCommand);