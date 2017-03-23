import { Injectable } from "@angular/core";
import { QueryBus } from "./query-bus.service";
import { CommandStore } from "./command-store.service";
import { AggregateFactory } from "./aggregate-factory.service";
import { Command } from "../models/commands/command";
import { Dictionary } from "../models/collections/dictionary";
import { CommandFork } from "../models/command-domain/commandFork";

@Injectable()
export class CommandBus {

    constructor(private readonly commandStore: CommandStore,
        private readonly aggregateFactory: AggregateFactory,
        private readonly queryBus: QueryBus) { }

    executeCommand = (fork: number, command: Command, persist: boolean): void => {
        if(persist)
            this.commandStore.store(fork, command);
        command.execute(fork, this.queryBus, this.aggregateFactory);
    }

    undoCommand = (fork: number, count: number): void => {
        for (let i = 0; i < count; i++) {
            const command = this.commandStore.undo(fork);
            command.undo(fork, this.queryBus, this.aggregateFactory);
        }
    }

    redoCommand = (fork: number, count: number): void => {
        for (let i = 0; i < count; i++) {
            const command = this.commandStore.redo(fork);
            command.execute(fork, this.queryBus, this.aggregateFactory);
        }
    }

    getCommandCount = (fork: number): number => {
        return this.commandStore.getCommandCount(fork);
    }

    getRedoCount = (fork: number): number => {
        return this.commandStore.getRedoCount(fork);
    }

    getCommandArchive = (fork: number): Array<string> => {
        return this.commandStore.getArchiveTitles(fork);
    }

    getFork = (fork: number) : CommandFork => {
        return this.commandStore.findFork(fork);
    }
}