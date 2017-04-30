import { Command } from './command';
import { FutureTargetSettableCommand } from './futureTargetSettableCommand';
import { QueryBus } from '../../services/query-bus.service';
import { TypeStoreFactory } from '../../services/type-store-factory.service';
import { WorkflowAggregate } from '../domain/workflow-aggregates/workflowAggregate';
import { TypeStore } from '../../services/type-store.service';
import { CommandType } from '../command-domain/commandType';

export class UpdatePropertyCommand extends FutureTargetSettableCommand {

    private previousValue: string;

    type = CommandType.Update;

    constructor(
        public targetHash: string,
        public propertyKey: string,
        public value: string
    ) { super(); }

    execute = (realityId: number, queryBus: QueryBus, typeStoreFactory: TypeStoreFactory) => {
        const target = queryBus.getAggregateRoot(realityId, this.targetHash) as WorkflowAggregate;
        this.previousValue = target.properties[this.propertyKey].value;
        target.properties[this.propertyKey].value = this.value;

        this.title = `updating ${this.targetHash}'s ${this.propertyKey} value from ${this.previousValue} to ${this.value}`;
    }

    undo = (realityId: number, queryBus: QueryBus, typeStoreFactory: TypeStoreFactory) => {
        const target = queryBus.getAggregateRoot(realityId, this.targetHash) as WorkflowAggregate;
        target.properties[this.propertyKey].value = this.previousValue;
    }

    setTarget = (hash: string) => {
        this.targetHash = hash;
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

    getValue = (): string => {
        return `[${this.value}]`;
    }

    clone = (): Command => {
        return new UpdatePropertyCommand(this.targetHash, this.propertyKey, this.value);
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

TypeStore.put(UpdatePropertyCommand);