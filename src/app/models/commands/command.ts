import { QueryBus } from '../../services/query-bus.service';
import { TypeStoreFactory } from '../../services/type-store-factory.service';
import { CommandType } from '../command-domain/commandType';

export abstract class Command {

  title: string = 'Command Executed';
  abstract aggregateHash: () => string;
  abstract execute: (realityId: number, queryBus: QueryBus, aggregateFactory: TypeStoreFactory) => void;
  abstract undo: (realityId: number, queryBus: QueryBus, aggregateFactory: TypeStoreFactory) => void;
  abstract getValue: () => string;

  abstract type: CommandType;
  __type__: string = (this.constructor as any).name;

  constructor() { }

  generateHash() { // TODO: Ignore certain id's (element could be the same with a different hash)
    let hash = 0;
    let string = JSON.stringify(this.toJSON());
    for (let i = 0; i < string.length; i++) {
      let char = string.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  abstract toJSON(): Object;
}
