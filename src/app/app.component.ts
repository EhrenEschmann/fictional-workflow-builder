import { Component } from '@angular/core';
import { WorkflowAggregate } from './models/domain/workflow-aggregates/workflowAggregate';
import { HashGenerator } from './services/hash-generator.service';
import { CreateNewWorkflowAggregateCommand } from './models/commands/createNewWorkflowAggregateCommand';
import { AddWorkflowAggregateToParentCommand } from './models/commands/addWorkflowAggregateToParentCommand';
import { AddWorkflowAggregateToRootCommand } from './models/commands/addWorkflowAggregateToRootCommand';
import { WorkflowManager } from './services/workflow-manager.service';
import { CommandBus } from './services/command-bus.service';
import { DomainStore } from './services/domain-store.service';
import { ViewState } from './services/view-state.service';

@Component({
  selector: "fwb-app",
  templateUrl: "./app/app.component.html"
})
export class AppComponent {
  //aggregates: Array<WorkflowAggregate>;

  constructor(private readonly hashGenerator: HashGenerator,
    private readonly workflowManager: WorkflowManager,
    private readonly commandBus: CommandBus,
    private readonly domainStore: DomainStore,
    private readonly viewState: ViewState) { }

  createNew = (): void => {
    this.workflowManager.createWorkflow("test");
  }

  undo = (count: number): void => {
    this.commandBus.undoCommand(0, count);
  }

  redo = (count: number): void => {
    this.commandBus.redoCommand(0, count);
  }

  addAggregate = (fork: number, parentHash: string, event: string): void => {

    var createCommand = new CreateNewWorkflowAggregateCommand("PostRestApiWorkflowAggregate", this.hashGenerator.createHash());

    // var addCommand = new AddWorkflowAggregateToTargetCommand(parentHash, event, createCommand);
    var addCommand = new AddWorkflowAggregateToRootCommand(createCommand);

    fork = 0;
    this.commandBus.executeCommand(fork, addCommand);
  }

  getRootAggregates = (): Array<WorkflowAggregate> => {
    if (this.domainStore.getWorkflow(0))
      return this.domainStore.getWorkflow(0).rootAggregate();
  }

  selectAggregate = (aggregate: WorkflowAggregate, event: string): void => {
    console.log(aggregate, event);
    this.viewState.selectedAggregate = aggregate;
    this.viewState.selectedEvent = event;
  }
}
