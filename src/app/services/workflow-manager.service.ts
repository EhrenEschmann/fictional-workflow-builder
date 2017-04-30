import { Injectable } from '@angular/core';
import { CommandStore } from './command-store.service';
import { CommandBus } from './command-bus.service';
import { DomainStore } from './domain-store.service';
import { DomainCache } from './domain-cache.service';
import { CommandReality } from '../models/command-domain/commandReality';
import { Command } from '../models/commands/command';
import { CommandOptimizer } from './command-optimizer.service';
import { CommandConflict } from '../models/command-domain/commandConflict';

// TODO:  The public contract should all exist on the command or querybus (commandBus.initialize(), queryBus.initialize())
@Injectable()
export class WorkflowManager {

    constructor(
        private readonly commandStore: CommandStore,
        private readonly commandBus: CommandBus,
        private readonly domainStore: DomainStore,
        private readonly domainCache: DomainCache,
        private readonly commandOptimizer: CommandOptimizer
    ) { }

    createWorkflow = (name: string) => {
        name = 'TODO_temp';
        this.domainStore.create(name);
        this.commandStore.startMainLine();
        this.domainCache.createCache(0);
    }

    loadWorkflow = () => {
        // TODO: get from database

        // TODO: hardcode from app.component for now.

        // var 
    }

    canUndo = (realityId: number): boolean => {
        let reality = this.commandStore.findReality(realityId);

        return reality.getUndoLength() === 0;
    }

    canRedo = (realityId: number): boolean => {
        let reality = this.commandStore.findReality(realityId);

        return reality.getRedoLength() === 0;
    }

    private cloneCommands(commands: Array<Command>): Array<Command> {
        let cloned: Array<Command> = [];
        for (let i = 0; i < commands.length; i++) {
            cloned.push(commands[i].clone());
        }
        return cloned;
    }

    forkWorkflow = (fromRealityId: number) => {
        let domainRealityId = this.domainStore.fork(fromRealityId);
        let commandRealityId = this.commandStore.fork(fromRealityId);
        if (domainRealityId !== commandRealityId) throw new Error('inconsistent domain/command reality state');
        this.domainCache.createCache(domainRealityId);

        let commandReality = this.commandStore.findReality(fromRealityId);
        let newArchive: Array<Command> = this.cloneCommands(commandReality.getArchive().concat(commandReality.getCurrent()));

        for (let command of newArchive) {
            this.commandBus.executeCommand(domainRealityId, command, true);
        }
    }

    optimize = (realityId: number): void => {
        let originalCommands = this.commandBus.getReality(realityId).getCurrent();

        this.commandBus.undoCommand(realityId, originalCommands.length);

        let optimizedStack = this.cloneCommands(this.commandOptimizer.optimize(originalCommands));

        let warnings: Array<string> = []; // todo make type warning???
        for (let command of optimizedStack) {
            try {
                this.commandBus.executeCommand(realityId, command);
            } catch (e) {
                warnings.push(e);
                console.log(`Error:  ${e}`);
            }
        }
        if (warnings.length > 0) {
            console.log('optimization completed with warnings: ' + warnings);
        }
    }

    postOrderMergeUpWorkflow = (fromReality: CommandReality, toRealityId: number) => {
        let toReality = this.commandStore.findReality(toRealityId);
        let fromCommands = fromReality.getCurrent();
        let toCommands = toReality.getCurrent();

        let allCommands = this.cloneCommands(toCommands.concat(fromCommands));

        this.commandBus.clearCurrent(toRealityId);

        this.commandBus.clear(fromReality.getId());

        for (let command of allCommands) {
            try {
                this.commandBus.executeCommand(toRealityId, command);
            } catch (e) {
                console.log(`Error:  ${e}`);
            }
        }

        let newArchive = this.cloneCommands(toReality.getArchive().concat(toReality.getCurrent()));
        for (let command of newArchive) {
            try {
                this.commandBus.executeCommand(fromReality.getId(), command, true);
            } catch (e) {
                console.log(`Error:  ${e}`);
            }
        }
        fromReality.setArchive(newArchive);
    }

    getConflicts = (fromReality: CommandReality, toReality: CommandReality): Array<CommandConflict> => {
        return this.commandOptimizer.getConflicts(fromReality.getCurrent(), toReality.getCurrent());
    }

    mergeDown = (realityId: number) => {
        const reality = this.commandBus.getReality(realityId);

        const childrenRealities = reality.getChildren();

        for (let childReality of childrenRealities) {
            let commands = this.cloneCommands(reality.getArchive().concat(reality.getCurrent()));
            let childRealityId = childReality.getId();
            let originalCommands = this.cloneCommands(childReality.getCurrent());

            this.commandBus.clear(childReality.getId());

            for (let command of commands) {
                this.commandBus.executeCommand(childRealityId, command, true);
            }
            childReality.setArchive(commands);

            for (let originalCommand of originalCommands) {
                try {
                    this.commandBus.executeCommand(childRealityId, originalCommand);
                } catch (e) {
                    console.log(`Error:  ${e}`);
                }
            }
        }
    }

    clearCurrent = (realityId: number) => {
        this.commandBus.clearCurrent(realityId);
    }

    clearAll = (realityId: number) => {
        this.commandBus.clear(realityId);
    }

    isLoaded = (): boolean => {
        return this.domainStore.isLoaded();
    }

    deleteReality = (realityId: number): void => {
        this.domainStore.getRealities()[realityId] = undefined;
    }
}