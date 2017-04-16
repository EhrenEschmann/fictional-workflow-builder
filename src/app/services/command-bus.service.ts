import { Injectable } from '@angular/core';
import { QueryBus } from './query-bus.service';
import { CommandStore } from './command-store.service';
import { TypeStoreFactory } from './type-store-factory.service';
import { Command } from '../models/commands/command';
import { CommandReality } from '../models/command-domain/commandReality';

@Injectable()
export class CommandBus {

    constructor(
        private readonly commandStore: CommandStore,
        private readonly typeStoreFactory: TypeStoreFactory,
        private readonly queryBus: QueryBus
    ) { }

    executeCommand = (realityId: number, command: Command, ignorePersist?: boolean): void => {
        command.execute(realityId, this.queryBus, this.typeStoreFactory);
        if (!ignorePersist)
            this.commandStore.storeCommand(realityId, command);
    }

    undoCommand = (realityId: number, count = 1): void => {
        for (let i = 0; i < count; i++) {
            const command = this.commandStore.undo(realityId);
            command.undo(realityId, this.queryBus, this.typeStoreFactory);
        }
    }

    redoCommand = (realityId: number, count: number): void => {
        for (let i = 0; i < count; i++) {
            const command = this.commandStore.redo(realityId);
            command.execute(realityId, this.queryBus, this.typeStoreFactory);
        }
    }

    getCommandCount = (realityId: number): number => {
        return this.commandStore.getCommandCount(realityId);
    }

    getRedoCount = (realityId: number): number => {
        return this.commandStore.getRedoCount(realityId);
    }

    getCurrentCommandTitles = (realityId: number): Array<string> => {
        return this.commandStore.getCurrent(realityId)
            .map((command: Command) => command.title);
    }

    getReality = (realityId: number): CommandReality => {
        return this.commandStore.findReality(realityId);
    }

    private clearArchive(realityId: number): void {
        const archive = this.getReality(realityId).getArchive();
        for (let i = archive.length - 1; i >= 0; i--) {
            archive[i].undo(realityId, this.queryBus, this.typeStoreFactory);
        }
    }

    clearCurrent = (realityId: number): void => {
        const current = this.getReality(realityId).getCurrent();
        for (let i = 0; i < current.length; i++) {
            this.undoCommand(realityId);
        }
    }

    clear = (realityId: number): void => {
        this.clearCurrent(realityId);
        this.clearArchive(realityId);
    }
}