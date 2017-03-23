import { QueryBus } from "../../services/query-bus.service";
import { AggregateFactory } from "../../services/aggregate-factory.service";

export abstract class Command {
  constructor() { }
  abstract execute: (fork: number, queryBus: QueryBus, aggregateFactory: AggregateFactory) => void;
  abstract undo: (fork: number, queryBus: QueryBus, aggregateFactory: AggregateFactory) => void;
  title: string = "Command Executed";

  generateHash() {
    var hash = 0;
    var string = JSON.stringify(this.toJSON())
    for (var i = 0; i < string.length; i++) {
      var char = string.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  //Override toJSON method on commands for JSON.Stringify()
  abstract toJSON(): Object;

  //Serves to help with de-serialization of commands
  __type__: string = (this.constructor as any).name;
}
