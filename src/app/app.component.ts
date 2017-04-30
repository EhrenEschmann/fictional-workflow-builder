import { Component } from '@angular/core';
import { HashGenerator } from './services/hash-generator.service';
import { WorkflowManager } from './services/workflow-manager.service';
import { CommandBus } from './services/command-bus.service';
import { DomainStore } from './services/domain-store.service';
import { ViewState } from './services/view-state.service';
import { Workflow } from './models/domain/workflow';
import { Hotkey, HotkeysService } from 'angular2-hotkeys';
import { Clipboard } from './services/clipboard.service';
import { MoveWorkflowAggregateToTargetCommand } from './models/commands/moveWorkflowAggregateToTargetCommand';
import { CreateNewWorkflowAggregateCommand } from './models/commands/createNewWorkflowAggregateCommand';

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
    private readonly viewState: ViewState,
    private readonly hotkeysService: HotkeysService,
    private readonly clipboard: Clipboard,
  ) { }

  ngOnInit() {
    this.hotkeysService.add(new Hotkey('ctrl+c', (event: KeyboardEvent): boolean => {
      this.clipboard.put(this.viewState.getSelectedAggregate(this.viewState.lastSelectedRealityId));
      return true;
    }));

    this.hotkeysService.add(new Hotkey('ctrl+v', (event: KeyboardEvent): boolean => {
      let command = this.clipboard.get();
      let realityId = this.viewState.lastSelectedRealityId;
      let parentHash = this.viewState.getSelectedAggregate(realityId).getHash();
      let parentEvent = this.viewState.getSelectedEvent(realityId);
      (command.updateCommands[0] as MoveWorkflowAggregateToTargetCommand).parentEvent = parentEvent;
      this.populateHashes(command, parentHash);
      console.log(command);
      this.commandBus.executeCommand(realityId, command);
      return false;
    }));
  }

  populateHashes = (command: CreateNewWorkflowAggregateCommand, toParentHash: string): void => {
    let targetHash = this.hashGenerator.createHash();
    command.targetHash = targetHash;
    for (let i = 0; i < command.updateCommands.length; i++) {
      if (command.updateCommands[i] instanceof MoveWorkflowAggregateToTargetCommand) {
        (command.updateCommands[i] as MoveWorkflowAggregateToTargetCommand).movingHash = targetHash;
        (command.updateCommands[i] as MoveWorkflowAggregateToTargetCommand).parentHash = toParentHash;
      } else if (command.updateCommands[i] instanceof CreateNewWorkflowAggregateCommand) {
        this.populateHashes(command.updateCommands[i] as CreateNewWorkflowAggregateCommand, targetHash);
      }
    }
  }

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
