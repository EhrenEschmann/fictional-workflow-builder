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

    // getFullHistoryOfCommands = (forkId: number): Array<Command> => {
    //     let previousCommands: Array<Command> = [];
    //     let fork = this.commandStore.findFork(forkId);
    //     let lengthToCopy = fork.getCurrentLength();
    //     while (fork !== undefined) {
    //         previousCommands = fork.getArchive().slice(0, lengthToCopy).concat(previousCommands);
    //         lengthToCopy = fork.getStart();
    //         fork = fork.getParent();
    //     }

    //     return previousCommands;
    // }

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
        // this.commandStore.findFork(forkId).setUndoLimit();
    }

    postOrderMergeWorkflow = (fromFork: CommandFork, toForkId: number) => {
        console.log('TODO:  Optimize before fork!');
        // domain stays intact
        // // get parent 
        // var fork = this.domainStore.getWorkflow(forkId);
        // var parentForkId = fork.getParent();
        // //      get fork 
        // var commandFork = this.commandStore.findFork(forkId);
        // get the forks stack
        // let lengthToCopy = fromFork.getUndoLength();
        //
        // this.optimize(toForkId);
        // this.optimize(fromFork.getId()); // This might optimize away a delete
        let toFork = this.commandStore.findFork(toForkId);
        let fromCommands = fromFork.getCurrent();   // .slice(0, lengthToCopy);
        let toCommands = toFork.getCurrent();

        let allCommands = toCommands.concat(fromCommands);

        // for (let i = 0; i < toCommands.length; i++) {
        //     this.commandBus.undoCommand(toForkId);
        // }
        // for (let i = 0; i < fromCommands.length; i++) {
        //     this.commandBus.undoCommand(fromFork.getId());
        // }

        // clear and rebuild toFork from archive
        this.commandBus.clearCurrent(toForkId);
        // for (let command of toFork.getArchive()) {
        //     try {
        //         this.commandBus.executeCommand(toForkId, command, true);
        //     } catch (e) {
        //         console.log(`Error:  ${e}`);
        //     }
        // }
        // clear and rebuild toFork from ~~NEW~~ archive
        this.commandBus.clear(fromFork.getId());

        // This command modifies the original commands; all prep work must be done before this.
        allCommands = this.commandOptimizer.optimize(allCommands);

        for (let command of allCommands) {
            try {
                this.commandBus.executeCommand(toForkId, command);
                //this.commandBus.executeCommand(fromFork.getId(), command, true);
            } catch (e) {
                console.log(`Error:  ${e}`);
            }
        }
        // fromFork.setStart(allCommands.length);


        let newArchive = toFork.getArchive().concat(toFork.getCurrent());
        for (let command of newArchive) {
            try {
                this.commandBus.executeCommand(fromFork.getId(), command, true);
            } catch (e) {
                console.log(`Error:  ${e}`);
            }
        }
        fromFork.setArchive(newArchive);
        // fromFork.clearStack();
        // toFork.setUndoLimit();

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

    // lastOrderMergeWorkflow = (fromFork: CommandFork, toForkId: number) => {
    //     console.log('TODO:  Optimize before fork!');
    //     // domain stays intact
    //     // // get parent 
    //     // var fork = this.domainStore.getWorkflow(forkId);
    //     // var parentForkId = fork.getParent();
    //     // //      get fork 
    //     // var commandFork = this.commandStore.findFork(forkId);
    //     // get the forks stack
    //     // let lengthToCopy = fromFork.getUndoLength();
    //     //
    //     this.optimize(toForkId);
    //     let commands = fromFork.getArchive();   // .slice(0, lengthToCopy);
    //     // apply forked commands on parent as-is, Track errors with try-catch
    //     let warnings: Array<string> = []; // todo make type warning???
    //     for (let command of commands) {
    //         try {
    //             this.commandBus.executeCommand(toForkId, command);
    //         } catch (e) {
    //             warnings.push(e);
    //             console.log(`Error:  ${e}`);
    //         }
    //     }
    //     // TODO:  Prevent Undo gathered
    //     fromFork.setUndoLimit();
    //     this.commandStore.findFork(toForkId).setUndoLimit();

    //     this.optimize(fromFork.getId()); // This might optimize away a delete
    //     // --------------------------------------
    //     // then what?  remove fork?  we can only do this once, IF we append the commands to the fork
    //     // we will prevent undo, then additional merges will only affect from that merge and on.
    //     // commandFork.setUndoLimit();
    //     // TODO: 1. assign children forks as children of parent.
    //     //   --> Unfortunately, children are no longer the same since their parent is changed,  reinitialize the fork ? 
    //     //            - no, leave it. we can store the start so we can choose to ignore all the changes after the start
    //     //            - wait, we can store the first start, but the second start could occur later in it's history (last order merge)
    //     //            - force a merge up after this completes, that will fix our problem.
    //     //            - prevent merges if children exist???
    //     // TODO: 2. delete (nullify) this fork
    //     // --------------------------------------
    // }

    mergeDown = (fromFork: CommandFork, toFork: CommandFork) => {
        // let conflicts = this.commandOptimizer.getConflicts(fromFork.getCurrent(), toFork.getCurrent());

    }

    getConflicts = (fromFork: CommandFork, toFork: CommandFork): Array<CommandConflict> => {
        return this.commandOptimizer.getConflicts(fromFork.getCurrent(), toFork.getCurrent());
    }

    mergeUp = (forkId: number) => {
        // 1. optimize
        this.optimize(forkId);

        // 2. Get fork
        const fork = this.commandBus.getFork(forkId);

        // 3. get commands
        const commands = fork.getCurrent();

        // 4. Get children forks
        const childrenForks = fork.getChildren();

        // loop over each child, perform merge up
        for (let childFork of childrenForks) {
            let childForkId = childFork.getId();
            this.optimize(childForkId);

            let originalCommands = this.commandStore.getArchive(childForkId);
            for (let i = 0; i < originalCommands.length; i++) {
                try {
                    this.commandBus.undoCommand(childForkId, 1); // go 1 at a time in case there are errors.
                } catch (e) {
                    console.log(`Error:  ${e}`);  // We shouldn't see any errors here.
                }
            }

            this.domainStore.clear(childForkId);

            for (let command of commands) {
                try {
                    this.commandBus.executeCommand(childForkId, command, true);
                } catch (e) {
                    // warnings.push(e);
                    console.log(`Error:  ${e}`);
                }
            }

            for (let originalCommand of originalCommands) {
                try {
                    this.commandBus.executeCommand(childForkId, originalCommand); // go 1 at a time in case there are errors.
                } catch (e) {
                    console.log(`Error:  ${e}`);  // We shouldn't see any errors here.
                }
            }
            // this.commandStore.findFork(childForkId).setUndoLimit();
            // this.commandStore.findFork(childForkId).setStart(commands.length);
            this.commandStore.findFork(childForkId).setArchive(commands);
        }
        // fork.setUndoLimit();
    }

    clear = (forkId: number) => {
        const archive = this.commandStore.getArchive(forkId);
        for (let originalCommand of archive) {
            try {
                this.commandBus.undoCommand(forkId); // go 1 at a time in case there are errors.
            } catch (e) {
                console.log(`Error:  ${e}`);  // We shouldn't see any errors here.
            }
        }
    }

    isLoaded = (): boolean => {
        return this.domainStore.isLoaded();
    }
}