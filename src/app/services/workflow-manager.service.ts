import { Injectable } from '@angular/core';
import { CommandStore } from "./command-store.service";
import { CommandBus } from "./command-bus.service";
import { DomainStore } from "./domain-store.service";
import { DomainCache } from "./domain-cache.service";
import { Workflow } from "../models/domain/workflow";
import { Command } from "../models/commands/command";
import { MergeType } from "../models/domain/mergeType";

@Injectable()
export class WorkflowManager {

    constructor(private readonly commandStore: CommandStore,
        private readonly commandBus: CommandBus,
        private readonly domainStore: DomainStore,
        private readonly domainCache: DomainCache
    ) { }

    createWorkflow = (name: string) => {
        name = "TODO_temp"
        this.domainStore.create(name);
        this.commandStore.startMainLine();
        this.domainCache.createCache(0);
    }

    loadWorkflow = () => {

        // TODO: get from database

        // TODO: hardcode from app.component for now.

        //var 
    }

    canUndo = (forkId: number): boolean => {
        var fork = this.commandStore.findFork(forkId);

        return fork.getUndoLength() == 0;
    }

    canRedo = (forkId: number): boolean => {
        var fork = this.commandStore.findFork(forkId);

        return fork.getRedoLength() == 0;
    }

    forkWorkflow = (fromFork: number) => {
        var domainFork = this.domainStore.fork(fromFork);
        var commandFork = this.commandStore.fork(fromFork);
        if (domainFork !== commandFork) throw new Error("inconsistent domain/command fork state");
        this.domainCache.createCache(domainFork);
        var previousCommands: Array<Command> = [];

        var fork = this.commandStore.findFork(fromFork);
        var lengthToCopy = fork.getCurrentLength();
        while (fork !== undefined) {
            previousCommands = fork.getArchive().slice(0, lengthToCopy).concat(previousCommands);
            lengthToCopy = fork.getStart();
            fork = fork.getParent();
        }

        for (let command of previousCommands) {
            this.commandBus.executeCommand(domainFork, command, false);
        }
    }

    optimize = (forkId: number): void => {
        console.log("TODO:  Optimize before fork!")
    }

    firstOrderMergeWorkflow = (forkId: number) => {
        // trucate domain side (or undo up to forked location, apply, then redo)

    }

    lastOrderMergeWorkflow = (forkId: number) => {
        // domain stays intact
        // get parent 
        var fork = this.domainStore.getWorkflow(forkId);
        var parentForkId = fork.getParent();
        //      get fork 
        var commandFork = this.commandStore.findFork(forkId);
        // get the forks stack
        var lengthToCopy = commandFork.getCurrentLength();
        var commands = commandFork.getArchive().slice(0, lengthToCopy);
        // apply forked commands on parent as-is, Track errors with try-catch
        var warnings: Array<string> = []; // todo make type warning???
        for (let command of commands) {
            try {
                this.commandBus.executeCommand(parentForkId, command, true)
            }
            catch (e) {
                warnings.push(e);
                console.log(`Error:  ${e}`);
            }            
        }
        // then what?  remove fork?  we can only do this once.
    }

    isLoaded = (): boolean => {
        return this.domainStore.isLoaded();
    }



}