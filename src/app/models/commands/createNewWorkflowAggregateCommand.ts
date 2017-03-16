import { Command } from './command';
import { FutureTargetSettableCommand } from './futureTargetSettableCommand';
import { QueryBus } from '../../services/query-bus.service';
import { AggregateFactory } from '../../services/aggregate-factory.service';
import {TypeInjector} from '../../services/type-injector.service';

export class CreateNewWorkflowAggregateCommand extends Command {

    constructor(public aggregateType: string,
        public targetHash: string
    ) { super(); }

    execute = (fork: number, queryBus: QueryBus, aggregateFactory: AggregateFactory) => {
        aggregateFactory.createAggregateByType(this.aggregateType, fork, this.targetHash);

        this.title = `Creating new ${this.aggregateType}`;
    }

    undo = (fork: number, queryBus: QueryBus, aggregateFactory: AggregateFactory) => {
        // TODO:  Clear new item from cache
    }

    toJSON() {
        return {
            __type__: this.__type__,
            aggregateType: this.aggregateType,
            targetHash: this.targetHash
        };
    }
}

TypeInjector.put(CreateNewWorkflowAggregateCommand.prototype.constructor.name, CreateNewWorkflowAggregateCommand);