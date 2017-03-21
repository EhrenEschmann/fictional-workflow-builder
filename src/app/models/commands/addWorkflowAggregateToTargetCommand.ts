import { Command } from './command';
import { FutureTargetSettableCommand } from './futureTargetSettableCommand';
import { QueryBus } from '../../services/query-bus.service';
import { AggregateFactory } from '../../services/aggregate-factory.service';
import { WorkflowAggregate } from '../domain/workflow-aggregates/workflowAggregate';
import { CreateNewWorkflowAggregateCommand } from './createNewWorkflowAggregateCommand';
import { TypeStore } from '../../services/type-store.service';

export class AddWorkflowAggregateToTargetCommand extends Command {

    constructor(public targetHash: string,
        public targetEvent: string,
        public createCommand: CreateNewWorkflowAggregateCommand
    ) { super(); }

    execute = (fork: number, queryBus: QueryBus, aggregateFactory: AggregateFactory) => {
        this.createCommand.execute(fork, queryBus, aggregateFactory);
        var target = queryBus.getAggregateRoot(fork, this.targetHash) as WorkflowAggregate;
        var newAggregate = queryBus.getAggregateRoot(fork, this.createCommand.targetHash) as WorkflowAggregate;
        newAggregate.parent = target.events[this.targetEvent];
        target.events[this.targetEvent].push(newAggregate);
        this.title = `${this.createCommand.title} and adding it to ${target.name}'s ${this.targetEvent} event`;
    }

    undo = (fork: number, queryBus: QueryBus, aggregateFactory: AggregateFactory) => {
        this.createCommand.undo(fork, queryBus, aggregateFactory);
        var target = queryBus.getAggregateRoot(fork, this.targetHash) as WorkflowAggregate;
        target.events[this.targetEvent].pop();
    }

    toJSON() {
        return {
            __type__: this.__type__,
            targetHash: this.targetHash,
            targetEvent: this.targetEvent,
            createCommand: this.createCommand
        };
    }
}

TypeStore.put(AddWorkflowAggregateToTargetCommand.prototype.constructor.name, AddWorkflowAggregateToTargetCommand);