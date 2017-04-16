import { Component } from '@angular/core';
import { HashGenerator } from './services/hash-generator.service';
import { WorkflowManager } from './services/workflow-manager.service';
import { CommandBus } from './services/command-bus.service';
import { DomainStore } from './services/domain-store.service';
import { ViewState } from './services/view-state.service';
import { Workflow } from './models/domain/workflow';

@Component({
  selector: 'fwb-app',
  templateUrl: './app/app.component.html'
})
export class AppComponent {
  // aggregates: Array<WorkflowAggregate>;

  constructor(
    private readonly hashGenerator: HashGenerator,
    private readonly workflowManager: WorkflowManager,
    private readonly commandBus: CommandBus,
    private readonly domainStore: DomainStore,
    private readonly viewState: ViewState
  ) { }

  createNew = (): void => {
    this.workflowManager.createWorkflow('test');
  }

  activeWorkflow = (): boolean => {
    return this.domainStore.getRealities() !== undefined;
  }

  getRootReality = (): Workflow => {
    if (this.workflowManager.isLoaded())
      return this.domainStore.getRealities()[0];
  }
}
