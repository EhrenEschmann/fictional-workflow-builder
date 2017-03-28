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
            try {
                this.commandBus.executeCommand(domainFork, command, true);
            } catch (e) {
                console.log(`Error:  ${e}`);
            }
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
        // restore to previous state
        let originalCommands = this.commandStore.getArchive(forkId);
        for (let originalCommand of originalCommands) {
            try {
                this.commandBus.undoCommand(forkId, 1); // go 1 at a time in case there are errors.
            } catch (e) {
                console.log(`Error:  ${e}`);
            }
        }

        let optimizedStack = this.commandOptimizer.optimize(originalCommands);
        // TODO:  This is not needed, the state will be identical
        // TODO:  This will work for the main branch, but not the children, those commands must be gathered.
        // TODO:  We will have to go back and get all previous commands, which might not be possible if a parent was optimized.

        // // // clear domain
        // this.domainStore.clear(forkId);
        // // // clear commands
        // this.commandStore.clear(forkId);

        // // TODO: Execute parents Stack
        // // 0. find current and parent
        // let current = this.commandStore.findFork(forkId);
        // let parent = current.getParent();
        // // 1. Get Commands
        // let previousCommands: Array<Command> = [];
        // while (parent !== undefined) {
        //     previousCommands = parent.getArchive().slice(0, current.getStart()).concat(previousCommands);
        //     current = parent;
        //     parent = current.getParent();
        // }

        // // previousCommands = previousCommands.concat(optimizedStack);
        // // execute optimized stack
        // // These are safe!
        // for (let command of previousCommands)
        //     this.commandBus.executeCommand(forkId, command, true);

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
        // let lengthToCopy = fromFork.getUndoLength();
        let commands = fromFork.getArchive();   // .slice(0, lengthToCopy);
        // apply forked commands on parent as-is, Track errors with try-catch
        let warnings: Array<string> = []; // todo make type warning???
        for (let command of commands) {
            try {
                this.commandBus.executeCommand(toForkId, command);
            } catch (e) {
                warnings.push(e);
                console.log(`Error:  ${e}`);
            }
        }
        // TODO:  Prevent Undo gathered
        fromFork.setUndoLimit();
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
