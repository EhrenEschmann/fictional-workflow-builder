import { QueryBus } from "../../services/query-bus.service";
import { AggregateFactory } from "../../services/aggregate-factory.service";
import { Command } from "./command";

export abstract class FutureTargetSettableCommand extends Command {
    abstract setTarget: (hash: string) => void;
}