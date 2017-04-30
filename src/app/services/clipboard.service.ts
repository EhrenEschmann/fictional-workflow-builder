import { Injectable } from '@angular/core';
import { WorkflowAggregate } from '../models/domain/workflow-aggregates/workflowAggregate';
import { CreateNewWorkflowAggregateCommand } from '../models/commands/createNewWorkflowAggregateCommand';
import { MoveWorkflowAggregateToTargetCommand } from '../models/commands/moveWorkflowAggregateToTargetCommand';
import { UpdatePropertyCommand } from '../models/commands/updatePropertyCommand';

@Injectable()
export class Clipboard {

  private clipboard: CreateNewWorkflowAggregateCommand;
  constructor() { }

  put = (aggregate: WorkflowAggregate) => {
    if (aggregate !== undefined) {
      this.clipboard = this.duplicate(aggregate, undefined);
    }
  }

  get = (): CreateNewWorkflowAggregateCommand => {
    return this.clipboard;
  }

  private duplicate(aggregate: WorkflowAggregate, toParentEvent: string): CreateNewWorkflowAggregateCommand {
    const createCommand = new CreateNewWorkflowAggregateCommand(aggregate.type, undefined, [
      new MoveWorkflowAggregateToTargetCommand(undefined, toParentEvent)
    ]);

    for (let property in aggregate.properties) {
      createCommand.updateCommands.push(new UpdatePropertyCommand(undefined, property, aggregate.properties[property].value));
    }

    for (let eventKey in aggregate.events) {
      for (let i = 0; i < aggregate.events[eventKey].length; i++) {
        createCommand.updateCommands.push(this.duplicate(aggregate.events[eventKey][i], eventKey));
      }
    }

    return createCommand;
  }

}