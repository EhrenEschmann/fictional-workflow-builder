import { Injectable } from '@angular/core';
import { CommandStore } from './command-store.service';
import { CommandBus } from './command-bus.service';
import { DomainStore } from './domain-store.service';
import { DomainCache } from './domain-cache.service';
import { CommandFork } from '../models/command-domain/commandFork';
import { Command } from '../models/commands/command';
import { CommandOptimizer } from './command-optimizer.service';

// TODO:  The public contract should all exist on the command or querybus (commandBus.initialize(), queryBus.initialize())
@Injectable()
export class WorkflowManager {

    constructor(private readonly commandStore: CommandStore,
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

    forkWorkflow = (fromFork: number) => {
        let domainFork = this.domainStore.fork(fromFork);
        let commandFork = this.commandStore.fork(fromFork);
        if (domainFork !== commandFork) throw new Error('inconsistent domain/command fork state');
        this.domainCache.createCache(domainFork);

        let previousCommands: Array<Command> = this.getCommands(fromFork);

        for (let command of previousCommands) {
            this.commandBus.executeCommand(domainFork, command, true);
        }
    }

    getCommands = (forkId: number): Array<Command> => {
        let previousCommands: Array<Command> = [];
        let fork = this.commandStore.findFork(forkId);
        let lengthToCopy = fork.getCurrentLength();
        while (fork !== undefined) {
            previousCommands = fork.getArchive().slice(0, lengthToCopy).concat(previousCommands);
            lengthToCopy = fork.getStart();
            fork = fork.getParent();
        }

        return previousCommands;
    }

    optimize = (forkId: number): void => {
        var originalCommands = this.commandStore.getArchive(forkId);
        var optimizedStack = this.commandOptimizer.optimize(originalCommands);

        // clear domain
        this.domainStore.clear(forkId);
        // clear commands
        this.commandStore.clear(forkId);
        // execute optimized stack
        for (let command of optimizedStack)
            this.commandBus.executeCommand(forkId, command);
    }

    firstOrderMergeWorkflow = (forkId: number) => {
        // trucate domain side (or undo up to forked location, apply, then redo)

    }

    lastOrderMergeWorkflow = (fromFork: CommandFork, toForkId: number) => {
        console.log('TODO:  Optimize before fork!');
        // domain stays intact
        // // get parent 
        // var fork = this.domainStore.getWorkflow(forkId);
        // var parentForkId = fork.getParent();
        // //      get fork 
        // var commandFork = this.commandStore.findFork(forkId);
        // get the forks stack
        var lengthToCopy = fromFork.getUndoLength();
        var commands = fromFork.getArchive().slice(0, lengthToCopy);
        // apply forked commands on parent as-is, Track errors with try-catch
        var warnings: Array<string> = []; // todo make type warning???
        for (let command of commands) {
            try {
                this.commandBus.executeCommand(toForkId, command);
            }
            catch (e) {
                warnings.push(e);
                console.log(`Error:  ${e}`);
            }
        }
        fromFork.disable();
        // --------------------------------------
        // then what?  remove fork?  we can only do this once, IF we append the commands to the fork
        // we will prevent undo, then additional merges will only affect from that merge and on.
        // commandFork.setUndoLimit();
        // TODO: 1. assign children forks as children of parent.
        //   --> Unfortunately, children are no longer the same since their parent is changed,  reinitialize the fork ? 
        //            - no, leave it. we can store the start so we can choose to ignore all the changes after the start
        //            - wait, we can store the first start, but the second start could occur later in it's history (last order merge)
        //            - force a merge up after this completes, that will fix our problem.
        //            - prevent merges if children exist???
        // TODO: 2. delete (nullify) this fork
        // --------------------------------------
    }

    isLoaded = (): boolean => {
        return this.domainStore.isLoaded();
    }

}