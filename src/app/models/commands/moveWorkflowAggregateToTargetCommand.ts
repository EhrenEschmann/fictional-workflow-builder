import { FutureTargetSettableCommand } from './futureTargetSettableCommand';
import { QueryBus } from '../../services/query-bus.service';
import { AggregateFactory } from '../../services/aggregate-factory.service';
import { WorkflowAggregate } from '../domain/workflow-aggregates/workflowAggregate';
import { TypeStore } from '../../services/type-store.service';
import { CommandType } from '../command-domain/commandType';
import { MoveCommand } from './moveCommand';

export class MoveWorkflowAggregateToTargetCommand extends FutureTargetSettableCommand implements MoveCommand {

    private previousParent: Array<WorkflowAggregate>;
    private previousIndex: number;

    type = CommandType.Move;

    constructor(
        public parentHash: string,
        public parentEvent: string,
        public movingHash?: string
    ) { super(); }

    execute = (realityId: number, queryBus: QueryBus, aggregateFactory: AggregateFactory) => {
        const parentAggregate = queryBus.getAggregateRoot(realityId, this.parentHash) as WorkflowAggregate;
        const movingAggregate = queryBus.getAggregateRoot(realityId, this.movingHash) as WorkflowAggregate;
        if (parentAggregate.events[this.parentEvent].indexOf(movingAggregate) !== -1)
            throw new Error(`Aggregate Already exists at ${this.parentHash}, ${this.parentEvent}`);

        this.previousParent = movingAggregate.parent;

        if (movingAggregate.parent) {
            this.previousIndex = movingAggregate.parent.indexOf(movingAggregate);
            movingAggregate.parent.splice(this.previousIndex, 1);
        }

        movingAggregate.parent = parentAggregate.events[this.parentEvent];
        parentAggregate.events[this.parentEvent].push(movingAggregate);
        this.title = `moving ${this.movingHash} to ${parentAggregate.name}'s ${this.parentEvent} event`;
    }

    undo = (realityId: number, queryBus: QueryBus, aggregateFactory: AggregateFactory) => {
        let movingAggregate = queryBus.getAggregateRoot(realityId, this.movingHash) as WorkflowAggregate;
        movingAggregate.parent.pop();
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