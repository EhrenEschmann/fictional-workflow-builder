import { Command } from './command';

export abstract class FutureTargetSettableCommand extends Command {
    abstract setTarget: (hash: string) => void;
}