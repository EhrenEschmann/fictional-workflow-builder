import { Injectable } from '@angular/core';
import { CommandStore } from './command-store.service';
import { CommandBus } from './command-bus.service';
import { DomainStore } from './domain-store.service';
import { DomainCache } from './domain-cache.service';
import { CommandFork } from '../models/command-domain/commandFork';
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

    canUndo = (forkId: number): boolean => {
        let fork = this.commandStore.findFork(forkId);

        return fork.getUndoLength() === 0;
    }

    canRedo = (forkId: number): boolean => {
        let fork = this.commandStore.findFork(forkId);

        return fork.getRedoLength() === 0;
    }

    forkWorkflow = (fromForkId: number) => {
        let domainForkId = this.domainStore.fork(fromForkId);
        let commandForkId = this.commandStore.fork(fromForkId);
        if (domainForkId !== commandForkId) throw new Error('inconsistent domain/command fork state');
        this.domainCache.createCache(domainForkId);

        let commandFork = this.commandStore.findFork(fromForkId);
        let newArchive: Array<Command> = commandFork.getArchive().concat(commandFork.getCurrent());

        for (let command of newArchive) {
            try {
                this.commandBus.executeCommand(domainForkId, command, true);
            } catch (e) {
                console.log(`Error:  ${e}`);
            }
        }
    }

    optimize = (forkId: number): void => {
        let originalCommands = this.commandBus.getFork(forkId).getCurrent();

        for (let originalCommand of originalCommands) {
            try {
                this.commandBus.undoCommand(forkId, 1); // go 1 at a time in case there are errors.
            } catch (e) {
                console.log(`Error:  ${e}`);
            }
        }

        let optimizedStack = this.commandOptimizer.optimize(originalCommands);

        // These are potentially volatile
        let warnings: Array<string> = []; // todo make type warning???
        for (let command of optimizedStack) {
            try {
                this.commandBus.executeCommand(forkId, command);
            } catch (e) {
                warnings.push(e);
                console.log(`Error:  ${e}`);
            }
        }
        console.log('completed with warnings: ' + warnings);
    }

    postOrderMergeUpWorkflow = (fromFork: CommandFork, toForkId: number) => {
        let toFork = this.commandStore.findFork(toForkId);
        let fromCommands = fromFork.getCurrent();
        let toCommands = toFork.getCurrent();

        let allCommands = toCommands.concat(fromCommands);

        // clear and rebuild toFork from archive
        this.commandBus.clearCurrent(toForkId);

        // clear and rebuild toFork from ~~NEW~~ archive
        this.commandBus.clear(fromFork.getId());

        // This command modifies the original commands; all prep work must be done before this.
        allCommands = this.commandOptimizer.optimize(allCommands);

        for (let command of allCommands) {
            try {
                this.commandBus.executeCommand(toForkId, command);
                // this.commandBus.executeCommand(fromFork.getId(), command, true);
            } catch (e) {
                console.log(`Error:  ${e}`);
            }
        }

        let newArchive = toFork.getArchive().concat(toFork.getCurrent());
        for (let command of newArchive) {
            try {
                this.commandBus.executeCommand(fromFork.getId(), command, true);
            } catch (e) {
                console.log(`Error:  ${e}`);
            }
        }
        fromFork.setArchive(newArchive);
    }

    getConflicts = (fromFork: CommandFork, toFork: CommandFork): Array<CommandConflict> => {
        return this.commandOptimizer.getConflicts(fromFork.getCurrent(), toFork.getCurrent());
    }

    mergeDown = (forkId: number) => {
        // 1. optimize
        this.optimize(forkId);

        // 2. Get fork
        const fork = this.commandBus.getFork(forkId);

        // 3. get commands
        let commands = fork.getArchive().concat(fork.getCurrent());
        commands = this.commandOptimizer.optimize(commands);

        // 4. Get children forks
        const childrenForks = fork.getChildren();

        // loop over each child, perform merge up
        for (let childFork of childrenForks) {
            let childForkId = childFork.getId();
            // this.optimize(childForkId);

            let originalCommands = childFork.getCurrent();

            this.commandBus.clear(childFork.getId());

            for (let command of commands) {
                this.commandBus.executeCommand(childForkId, command, true); // TODO:  try/catch this???  
            }
            childFork.setArchive(commands);

            for (let originalCommand of originalCommands) {
                try {
                    this.commandBus.executeCommand(childForkId, originalCommand); // go 1 at a time in case there are errors.
                } catch (e) {
                    console.log(`Error:  ${e}`);  // We shouldn't see any errors here.
                }
            }
        }
    }

    clearCurrent = (forkId: number) => {
        this.commandBus.clearCurrent(forkId);
    }

     clearAll = (forkId: number) => {
         this.commandBus.clear(forkId);
     }

    isLoaded = (): boolean => {
        return this.domainStore.isLoaded();
    }

    deleteFork = (forkId: number): void => {
        this.domainStore.getForks()[forkId] = undefined;
    }
}