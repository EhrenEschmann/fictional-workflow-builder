import { Command } from './command';
import { FutureTargetSettableCommand } from './futureTargetSettableCommand';
import { QueryBus } from '../../services/query-bus.service';
import { TypeStoreFactory } from '../../services/type-store-factory.service';
import { TypeStore } from '../../services/type-store.service';
import { CommandType } from '../command-domain/commandType';

export class CreateNewWorkflowAggregateCommand extends Command {

    type = CommandType.Create;

    constructor(
        public aggregateType: string,
        public targetHash: string,
        public updateCommands: Array<FutureTargetSettableCommand> = []
    ) { super(); }

    execute = (realityId: number, queryBus: QueryBus, typeStoreFactory: TypeStoreFactory) => {
        typeStoreFactory.createAggregateByType(this.aggregateType, realityId, this.targetHash);

        for (let command of this.updateCommands) {
            command.setTarget(this.targetHash);
            command.execute(realityId, queryBus, typeStoreFactory);
        }

        this.title = `Creating new ${this.aggregateType} ${this.targetHash}`;
    }

    undo = (realityId: number, queryBus: QueryBus, aggregateFactory: TypeStoreFactory) => {
        for (let j = this.updateCommands.length - 1; j >= 0; j--) {
            this.updateCommands[j].undo(realityId, queryBus, aggregateFactory);
        }
        aggregateFactory.invalidateCache(realityId, this.targetHash);
    }

    aggregateHash = (): string => {
        return this.targetHash;
    }

    getValue = (): string => {
        return 'Create';
    }

    toJSON() {
        return {
            __type__: this.__type__,
            aggregateType: this.aggregateType,
            targetHash: this.targetHash,
            updateCommands: this.updateCommands
        };
    }
}

TypeStore.put(CreateNewWorkflowAggregateCommand);