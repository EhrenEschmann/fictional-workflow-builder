import { Command } from './command';
import { FutureTargetSettableCommand } from './futureTargetSettableCommand';
import { QueryBus } from '../../services/query-bus.service';
import { AggregateFactory } from '../../services/aggregate-factory.service';
import { Workflow } from '../domain/workflow';
import { WorkflowAggregate } from '../domain/workflow-aggregates/workflowAggregate';
import { CreateNewWorkflowAggregateCommand } from './createNewWorkflowAggregateCommand';
import { TypeStore } from '../../services/type-store.service';
import { CommandType } from "../command-domain/commandType";
import { MoveCommand } from "./moveCommand";

export class MoveWorkflowAggregateToRootCommand extends FutureTargetSettableCommand implements MoveCommand {

    constructor(
        public movingHash?: string
    ) { super(); }

    private previousParent: Array<WorkflowAggregate>;
    private previousIndex: number;
    execute = (fork: number, queryBus: QueryBus, aggregateFactory: AggregateFactory) => {
        var workflow = queryBus.getRootObject(fork) as Workflow;
        var movingAggregate = queryBus.getAggregateRoot(fork, this.movingHash) as WorkflowAggregate;
        this.previousParent = movingAggregate.parent;
        if (movingAggregate.parent) {
            this.previousIndex = movingAggregate.parent.indexOf(movingAggregate)
            movingAggregate.parent.splice(this.previousIndex, 1);
        }
        movingAggregate.parent = workflow.rootAggregate();
        workflow.rootAggregate().push(movingAggregate);
        this.title = `moving ${this.movingHash} to main workflow`;
    }

    undo = (fork: number, queryBus: QueryBus, aggregateFactory: AggregateFactory) => {
        var movingAggregate = queryBus.getAggregateRoot(fork, this.movingHash) as WorkflowAggregate;
        var workflow = queryBus.getRootObject(fork) as Workflow;
        workflow.rootAggregate().pop();
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
        return undefined;
    }

    toJSON() {
        return {
            __type__: this.__type__,
            movingHash: this.movingHash
        }
    }
}

TypeStore.put(MoveWorkflowAggregateToRootCommand.prototype.constructor.name, MoveWorkflowAggregateToRootCommand);