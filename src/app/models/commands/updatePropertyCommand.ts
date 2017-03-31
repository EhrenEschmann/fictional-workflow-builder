import { Command } from './command';
import { QueryBus } from '../../services/query-bus.service';
import { AggregateFactory } from '../../services/aggregate-factory.service';
import { WorkflowAggregate } from '../domain/workflow-aggregates/workflowAggregate';
import { TypeStore } from '../../services/type-store.service';
import { CommandType } from '../command-domain/commandType';

export class UpdatePropertyCommand extends Command {

    private previousValue: string;

    type = CommandType.Update;

    constructor(
        public targetHash: string,
        public propertyKey: string,
        public value: string
    ) { super(); }

    execute = (fork: number, queryBus: QueryBus, aggregateFactory: AggregateFactory) => {
        const target = queryBus.getAggregateRoot(fork, this.targetHash) as WorkflowAggregate;
        this.previousValue = target.properties[this.propertyKey].value;
        target.properties[this.propertyKey].value = this.value;

        this.title = `updating ${target.name}'s ${this.propertyKey} value from ${this.previousValue} to ${this.value}`;
    }

    undo = (fork: number, queryBus: QueryBus, aggregateFactory: AggregateFactory) => {
        const target = queryBus.getAggregateRoot(fork, this.targetHash) as WorkflowAggregate;
        target.properties[this.propertyKey].value = this.previousValue;
    }

    updatedHash = () => {
        return this.targetHash;
    }

    property = () => {
        return this.propertyKey;
    }

    aggregateHash = (): string => {
        return this.targetHash;
    }

    toJSON() {
        return {
            __type__: this.__type__,
            targetHash: this.targetHash,
            propertyKey: this.propertyKey,
            value: this.value
        };
    }
}

TypeStore.put(UpdatePropertyCommand.prototype.constructor.name, UpdatePropertyCommand);