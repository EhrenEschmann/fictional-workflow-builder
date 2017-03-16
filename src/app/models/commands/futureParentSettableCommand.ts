import { QueryBus } from "../../services/query-bus.service";
import { AggregateFactory } from "../../services/aggregate-factory.service";
import { Command } from "./command";

export abstract class FutureParentSettableCommand extends Command {

    parentHash: string;

    setTarget = (hash: string) => {
        this.parentHash = hash;   
    }
}