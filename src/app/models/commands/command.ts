import { QueryBus } from "../../services/query-bus.service";
import { AggregateFactory } from "../../services/aggregate-factory.service";

export abstract class Command {
  constructor() { }
  abstract execute: ( fork: number, queryBus: QueryBus, aggregateFactory: AggregateFactory) => void;
  abstract undo: (fork: number, queryBus: QueryBus, aggregateFactory: AggregateFactory) => void;
  title: string = "Command Executed";

  //Override toJSON method on commands for JSON.Stringify()
  abstract toJSON(): Object;

  //Serves to help with de-serialization of commands
  __type__: string = (this.constructor as any).name;
}
