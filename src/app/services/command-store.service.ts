import { Injectable } from '@angular/core';
import { Dictionary } from "../models/collections/dictionary";
import { CommandFork } from "../models/command-domain/commandFork";
import { Command } from "../models/commands/command";

@Injectable()
export class CommandStore {
  private workflow: Array<CommandFork>;

  constructor() { }

  startMainLine = (): void => {
    this.workflow = [];
    this.workflow.push(new CommandFork(0));
  }

  loadFork = (workflowForks: Array<CommandFork>): void => {
    this.workflow = workflowForks;
  }

  fork = (fromFork: number): void => {
    var start = this.workflow[fromFork].getLength();
    this.workflow.push(new CommandFork(start));
  }

  execute = (fork: number, command: Command): void => {
    this.workflow[fork].storeCommand(command);
  }

  undo = (fork: number): Command => {
    return this.workflow[fork].getUndoCommand();
  }

  redo = (fork: number): Command => {
    return this.workflow[fork].getRedoCommand();
  }

  getCommandCount = (fork: number): number => {
    return this.workflow[fork].getUndoLength();
  }

  getRedoCount = (fork: number): number => {
    return this.workflow[fork].getRedoLength();
  }

  getArchiveTitles = (fork: number): Array<string> => {
       var titles = [];
       return this.workflow[fork].getArchive().map((command: Command) => command.title);
  }
}