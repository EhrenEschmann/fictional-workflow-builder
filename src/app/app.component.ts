import { Component } from '@angular/core';
import { WorkflowAggregate } from './models/domain/workflow-aggregates/workflowAggregate';
import { HashGenerator } from './services/hash-generator.service';
import { CreateNewWorkflowAggregateCommand } from './models/commands/createNewWorkflowAggregateCommand';
import { MoveWorkflowAggregateToTargetCommand } from './models/commands/moveWorkflowAggregateToTargetCommand';
import { MoveWorkflowAggregateToRootCommand } from './models/commands/moveWorkflowAggregateToRootCommand';
import { WorkflowManager } from './services/workflow-manager.service';
import { CommandBus } from './services/command-bus.service';
import { DomainStore } from './services/domain-store.service';
import { ViewState } from './services/view-state.service';
import { Workflow } from './models/domain/workflow';

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

  activeWorkflow = (): boolean => {
    return this.domainStore.getForks() !== undefined;
  }

  getRootFork = (): Workflow => {
    if (this.workflowManager.isLoaded())
      return this.domainStore.getForks()[0];
  }
}
