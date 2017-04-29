import { Injectable } from '@angular/core';
import { CommandReality } from '../models/command-domain/commandReality';
import { Command } from '../models/commands/command';

@Injectable()
export class CommandStore {
  private workflow: CommandReality; // root of tree

  constructor() { }

  startMainLine = (): void => {
    this.workflow = new CommandReality(0);
  }

  private find(workflow: CommandReality, realityId: number): CommandReality {
    if (workflow.getId() === realityId) return workflow;
    let foundReality: CommandReality;
    for (let child of workflow.getChildren()) {
      foundReality = this.find(child, realityId);
      if (foundReality)
        return foundReality;
    }
    return undefined;
  }

  findReality = (realityId: number): CommandReality => {
    return this.find(this.workflow, realityId);
  }

  private countChildren(workflow: CommandReality): number {
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

  private cloneCommands(commands: Array<Command>): Array<Command> {
    let cloned: Array<Command> = [];
    for (let i = 0; i < commands.length; i++) {
      cloned.push(commands[i].clone());
    }
    return cloned;
  }

  fork = (fromRealityId: number): number => {
    let reality = this.findReality(fromRealityId);
    let newId = this.getSize();
    let newArchive = this.cloneCommands(reality.getArchive().concat(reality.getCurrent()));
    reality.addChild(new CommandReality(newId, newArchive, reality));
    return newId;
  }

  storeCommand = (realityId: number, command: Command): void => {
    this.findReality(realityId).storeCommand(command);
  }

  undo = (realityId: number): Command => {
    return this.findReality(realityId).getUndoCommand();
  }

  redo = (realityId: number): Command => {
    return this.findReality(realityId).getRedoCommand();
  }

  getCommandCount = (realityId: number): number => {
    return this.findReality(realityId).getCurrentLength();
  }

  getRedoCount = (realityId: number): number => {
    return this.findReality(realityId).getRedoLength();
  }

  getCurrent = (realityId: number): Array<Command> => {
    return this.findReality(realityId).getCurrent();
  }

  // getArchiveTitles = (realityId: number): Array<string> => {
  //   return this.getArchive(realityId).map((command: Command) => command.title);
  // }
}