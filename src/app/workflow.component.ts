import { Component, Input, OnInit } from '@angular/core';
import { WorkflowAggregate } from './models/domain/workflow-aggregates/workflowAggregate';
import { HashGenerator } from './services/hash-generator.service';
import { CreateNewWorkflowAggregateCommand } from './models/commands/createNewWorkflowAggregateCommand';
import { MoveWorkflowAggregateToTargetCommand } from './models/commands/moveWorkflowAggregateToTargetCommand';
import { MoveWorkflowAggregateToRootCommand } from './models/commands/moveWorkflowAggregateToRootCommand';
import { WorkflowManager } from './services/workflow-manager.service';
import { CommandBus } from './services/command-bus.service';
import { QueryBus } from './services/query-bus.service';
import { ViewState } from './services/view-state.service';
import { Workflow } from './models/domain/workflow';
import { MergeTypeAware } from './decorators/mergeTypeAware.decorator';
import { ResolutionAware } from './decorators/resolutionAware.decorator';
import { CommandConflict } from './models/command-domain/commandConflict';
import { Resolution } from './models/domain/resolution';
import { Hotkey, HotkeysService } from 'angular2-hotkeys';

@Component({
    selector: 'fwb-workflow',
    templateUrl: './app/workflow.component.html'
})
@ResolutionAware
@MergeTypeAware
export class WorkflowComponent implements OnInit {
    @Input() workflow: Workflow;

    private mergeDialogDisplayed: boolean = false;
    private availableAggregates: Array<any>;


    private commandTitles: Array<Object> = [];
    private conflicts: Array<CommandConflict> = []; // This can be it's own component

    constructor(
        private readonly hashGenerator: HashGenerator,
        private readonly workflowManager: WorkflowManager,
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
        private readonly viewState: ViewState
    ) { }

    ngOnInit() {
        this.availableAggregates = [
            {
                label: 'Execute Compiled Binary',
                command: () => {
                    const realityId = this.getRealityId();
                    this.addAggregate(realityId, this.viewState.getSelectedAggregate(realityId),
                        this.viewState.getSelectedEvent(realityId), 'ExecuteCompiledBinaryWorkflowAggregate');
                }
            },
            {
                label: 'Post Rest Api',
                command: () => {
                    const realityId = this.getRealityId();
                    this.addAggregate(realityId, this.viewState.getSelectedAggregate(realityId),
                        this.viewState.getSelectedEvent(realityId), 'PostRestApiWorkflowAggregate');
                }
            }, {
                label: 'Send Email',
                command: () => {
                    const realityId = this.getRealityId();
                    this.addAggregate(realityId, this.viewState.getSelectedAggregate(realityId),
                        this.viewState.getSelectedEvent(realityId), 'SendEmailWorkflowAggregate');
                }
            }
        ];
    }

    canUndo = (realityId: number): boolean => {
        return this.workflowManager.canUndo(realityId);
    }

    undo = (realityId: number, count: number): void => {
        this.commandBus.undoCommand(realityId, count);
        this.viewState.clearSelectedAggregates(realityId);
    }

    getParentId = (realityId: number): number => {
        return this.queryBus.getRootObject(realityId).getParent();
    }

    canRedo = (realityId: number): boolean => {
        return this.workflowManager.canRedo(realityId);
    }

    redo = (realityId: number, count: number): void => {
        this.commandBus.redoCommand(realityId, count);
    }

    getRealityId = (): number => {
        return this.workflow.getRealityId();
    }

    addRandomAggregate = (realityId: number, parent: WorkflowAggregate, event: string): void => {
        const random = Math.floor(Math.random() * 3);
        this.availableAggregates[random].command();
    }

    addAggregate = (realityId: number, parent: WorkflowAggregate, event: string, aggregateType: string): void => {
        let createCommand = new CreateNewWorkflowAggregateCommand(aggregateType, this.hashGenerator.createHash());
        let moveCommand = (parent && event)
            ? new MoveWorkflowAggregateToTargetCommand(parent.getHash(), event)
            : new MoveWorkflowAggregateToRootCommand();

        createCommand.updateCommands.push(moveCommand);
        this.commandBus.executeCommand(realityId, createCommand);
    }

    getRootAggregates = (): Array<WorkflowAggregate> => {
        let realityId = this.getRealityId();
        if (this.queryBus.getRootObject(realityId))
            return this.queryBus.getRootObject(realityId).rootAggregate();
    }

    fork = (fromRealityId: number) => {
        // this.workflowManager.optimize(fromRealityId);
        this.workflowManager.forkWorkflow(fromRealityId);
    }

    selectAggregate = (realityId: number, aggregate: WorkflowAggregate, event: string): void => {
        this.viewState.setSelectedAggregate(aggregate, undefined, realityId);
    }

    getChildrenRealities = (): Array<Workflow> => {
        return this.queryBus.getRootObjects().filter((workflow: Workflow) => {
            return workflow.getParent() === this.getRealityId();
        });
    }

    attemptMergeUp = (realityId: number) => {
        this.updateConflicts(realityId);
        if (this.conflicts.length > 0) {
            this.mergeDialogDisplayed = true;
        } else {
            this.mergeUp(realityId);
        }
    }

    mergeUp = (realityId: number) => {
        let reality = this.commandBus.getReality(realityId);
        this.workflowManager.postOrderMergeUpWorkflow(reality, reality.getParent().getId());
        this.viewState.clearSelectedAggregates(realityId);

        // this.workflowManager.deleteFork(forkId);  // TODO:  flag on fork preventing display?, then we would have to
        //                                                  pass-through merges to parent.
    }

    updateConflicts = (realityId: number): void => {
        const reality = this.commandBus.getReality(realityId);
        this.conflicts = this.workflowManager.getConflicts(reality, reality.getParent());
    }

    mergeDown = (realityId: number): void => {
        this.workflowManager.mergeDown(realityId);
        this.viewState.clearSelectedAggregates(realityId);
    }

    getCommandTitles = (realityId: number): Array<Object> => {
        let current = this.commandBus.getCurrentCommandTitles(realityId);

        if (current.length > this.commandTitles.length) {
            const toAdd = current.slice(this.commandTitles.length, current.length);
            this.commandTitles = this.commandTitles.concat(toAdd.map((str) => { return { 'label': str }; }));
        } else if (current.length < this.commandTitles.length) {
            this.commandTitles = current.map((str) => { return { 'label': str }; });
        }
        return this.commandTitles;
    }

    getStackLengths = (realityId: number): Array<number> => {
        const reality = this.commandBus.getReality(realityId);
        return [reality.getArchive().length, reality.getCurrent().length];
    }

    clear = (realityId: number) => {
        this.workflowManager.clearCurrent(realityId);
        this.viewState.clearSelectedAggregates(realityId);
    }

    optimize = (realityId: number) => {
        this.workflowManager.optimize(realityId);
        this.viewState.clearSelectedAggregates(realityId);
    }

    resolveConflict = (conflict: CommandConflict, resolution: Resolution): void => {
        const fromRealityId = this.getRealityId();

        if (resolution === Resolution.Parent) {
            this.commandBus.executeCommand(fromRealityId, conflict.toCommand);
        }
        // If we chose the child, it would get applied after and overwrite when the merge is complete
        // else if (resolution === Resolution.Child) {
        //     this.commandBus.executeCommand(toForkId, conflict.fromCommand);
        // }
        this.conflicts.splice(this.conflicts.indexOf(conflict), 1);
    }

    onRootDrop = (realityId: number, $event: DragEvent): void => {
        const draggingAggregate = this.viewState.draggedAggregate;

        if (draggingAggregate.parent === undefined) return;
        // if (aggregate === draggingAggregate) return;
        // prevent dropping parent as child

        let command = new MoveWorkflowAggregateToRootCommand(draggingAggregate.getHash());
        this.commandBus.executeCommand(realityId, command);
        $event.stopPropagation();
    }

}