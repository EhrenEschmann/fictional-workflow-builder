import { Injectable } from '@angular/core';
import { CommandFork } from '../models/command-domain/commandFork';
import { Command } from '../models/commands/command';

@Injectable()
export class CommandStore {
  private workflow: CommandFork; // root of tree

  constructor() { }

  startMainLine = (): void => {
    this.workflow = new CommandFork(0);
  }

  loadFork = (workflowForks: Array<CommandFork>): void => {
    // this.workflow = workflowForks;
  }

  private find(workflow: CommandFork, fork: number): CommandFork {
    if (workflow.getId() === fork) return workflow;
    let foundFork: CommandFork;
    for (let child of workflow.getChildren()) {
      foundFork = this.find(child, fork);
      if (foundFork)
        return foundFork;
    }
    return undefined;
  }

  findFork = (fork: number): CommandFork => {
    return this.find(this.workflow, fork);
  }

  private countChildren(workflow: CommandFork): number {
    if (!workflow.getChildren()) return 0;
    let sum = 0;
    for (let child of workflow.getChildren()) {
      sum += this.countChildren(child) + 1;
    }
    return sum;
  }

  private getSize(): number {
    return this.countChildren(this.workflow) + 1;
  }

  fork = (fromFork: number): number => {
    let fork = this.findFork(fromFork);
    let newId = this.getSize();
    // fork.setUndoLimit();
    let newArchive = fork.getArchive().concat(fork.getCurrent());
    fork.addChild(new CommandFork(newId, newArchive, fork));
    return newId;
  }

  storeCommand = (fork: number, command: Command): void => {
    this.findFork(fork).storeCommand(command);
  }

  undo = (fork: number): Command => {
    return this.findFork(fork).getUndoCommand();
  }

  redo = (fork: number): Command => {
    return this.findFork(fork).getRedoCommand();
  }

  getCommandCount = (fork: number): number => {
    return this.findFork(fork).getCurrentLength();
  }

  getRedoCount = (fork: number): number => {
    return this.findFork(fork).getRedoLength();
  }

  getArchive = (fork: number): Array<Command> => {
    return this.findFork(fork).getCurrent();
  }

  getArchiveTitles = (fork: number): Array<string> => {
    return this.getArchive(fork).map((command: Command) => command.title);
  }
}