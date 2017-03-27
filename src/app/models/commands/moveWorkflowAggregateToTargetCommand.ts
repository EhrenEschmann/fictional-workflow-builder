import { Command } from './command';
import { FutureTargetSettableCommand } from './futureTargetSettableCommand';
import { QueryBus } from '../../services/query-bus.service';
import { AggregateFactory } from '../../services/aggregate-factory.service';
import { WorkflowAggregate } from '../domain/workflow-aggregates/workflowAggregate';
import { CreateNewWorkflowAggregateCommand } from './createNewWorkflowAggregateCommand';
import { TypeStore } from '../../services/type-store.service';
import { CommandType } from "../command-domain/commandType";
import { MoveCommand } from "./moveCommand";

export class MoveWorkflowAggregateToTargetCommand extends FutureTargetSettableCommand implements MoveCommand {

    constructor(
        public parentHash: string,
        public parentEvent: string,
        public movingHash?: string
    ) { super(); }

    private previousParent: Array<WorkflowAggregate>;
    private previousIndex: number;
    execute = (fork: number, queryBus: QueryBus, aggregateFactory: AggregateFactory) => {
        var parentAggregate = queryBus.getAggregateRoot(fork, this.parentHash) as WorkflowAggregate;
        var movingAggregate = queryBus.getAggregateRoot(fork, this.movingHash) as WorkflowAggregate;
        this.previousParent = movingAggregate.parent;

        if (movingAggregate.parent) {
            this.previousIndex = movingAggregate.parent.indexOf(movingAggregate)
            movingAggregate.parent.splice(this.previousIndex, 1);
        }

        movingAggregate.parent = parentAggregate.events[this.parentEvent];
        parentAggregate.events[this.parentEvent].push(movingAggregate);
        this.title = `moving ${this.movingHash} to ${parentAggregate.name}'s ${this.parentEvent} event`;
    }

    undo = (fork: number, queryBus: QueryBus, aggregateFactory: AggregateFactory) => {
        var movingAggregate = queryBus.getAggregateRoot(fork, this.movingHash) as WorkflowAggregate;
        movingAggregate.parent.pop();
        if (this.previousParent) {
            this.previousParent.splice(this.previousIndex, 0, movingAggregate);
        }
        movingAggregate.parent = this.previousParent;
    }

    setTarget = (hash: string) => {
        this.movingHash = hash;
    }

    type = CommandType.Move;

    aggregateHash = (): string => {
        return this.movingHash;
    }

    getNewParentHash = (): string => {
        return this.parentHash;
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

TypeStore.put(MoveWorkflowAggregateToTargetCommand.prototype.constructor.name, MoveWorkflowAggregateToTargetCommand);