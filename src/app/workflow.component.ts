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
                    const forkId = this.getForkNum();
                    this.addAggregate(forkId, this.viewState.selectedAggregate[forkId],
                        this.viewState.selectedEvent[forkId], 'ExecuteCompiledBinaryWorkflowAggregate');
                }
            },
            {
                label: 'Post Rest Api',
                command: () => {
                    const forkId = this.getForkNum();
                    this.addAggregate(forkId, this.viewState.selectedAggregate[forkId],
                        this.viewState.selectedEvent[forkId], 'PostRestApiWorkflowAggregate');
                }
            }, {
                label: 'Send Email',
                command: () => {
                    const forkId = this.getForkNum();
                    this.addAggregate(forkId, this.viewState.selectedAggregate[forkId],
                        this.viewState.selectedEvent[forkId], 'SendEmailWorkflowAggregate');
                }
            }
        ];
    }

    canUndo = (forkId: number): boolean => {
        return this.workflowManager.canUndo(forkId);
    }

    undo = (fork: number, count: number): void => {
        this.commandBus.undoCommand(fork, count);
        this.viewState.clearSelectedAggregates(fork);
    }

    getParentId = (forkId: number): number => {
        return this.queryBus.getRootObject(forkId).getParent();
    }

    canRedo = (forkId: number): boolean => {
        return this.workflowManager.canRedo(forkId);
    }

    redo = (fork: number, count: number): void => {
        this.commandBus.redoCommand(fork, count);
    }

    getForkNum = (): number => {
        return this.workflow.getForkId();
    }

    addRandomAggregate = (fork: number, parent: WorkflowAggregate, event: string): void => {
        const random = Math.floor(Math.random() * 3);
        this.availableAggregates[random].command();
    }

    addAggregate = (fork: number, parent: WorkflowAggregate, event: string, aggregateType: string): void => {
        let createCommand = new CreateNewWorkflowAggregateCommand(aggregateType, this.hashGenerator.createHash());
        let moveCommand = (parent && event)
            ? new MoveWorkflowAggregateToTargetCommand(parent.getHash(), event)
            : new MoveWorkflowAggregateToRootCommand();

        createCommand.updateCommands.push(moveCommand);
        this.commandBus.executeCommand(fork, createCommand);
    }

    getRootAggregates = (): Array<WorkflowAggregate> => {
        let forkId = this.getForkNum();
        if (this.queryBus.getRootObject(forkId))
            return this.queryBus.getRootObject(forkId).rootAggregate();
    }

    fork = (forkFrom: number) => {
        this.workflowManager.optimize(forkFrom);
        this.workflowManager.forkWorkflow(forkFrom);
    }

    selectAggregate = (fork: number, aggregate: WorkflowAggregate, event: string): void => {
        this.viewState.selectedAggregate[fork] = aggregate;
        this.viewState.selectedEvent[fork] = event;
    }

    getChildrenForks = (): Array<Workflow> => {
        return this.queryBus.getRootObjects().filter((workflow: Workflow) => {
            return workflow.getParent() === this.getForkNum();
        });
    }

    attemptMergeUp = (forkId: number) => {
        this.updateConflicts(forkId);
        if (this.conflicts.length > 0) {
            this.mergeDialogDisplayed = true;
        } else {
            this.mergeUp(forkId);
        }
    }

    mergeUp = (forkId: number) => {
        let fork = this.commandBus.getFork(forkId);
        this.workflowManager.postOrderMergeUpWorkflow(fork, fork.getParent().getId());
        this.viewState.clearSelectedAggregates(forkId);

        // this.workflowManager.deleteFork(forkId);
    }

    private conflicts: Array<CommandConflict> = [];
    updateConflicts = (forkId: number): void => {
        const fork = this.commandBus.getFork(forkId);
        this.conflicts = this.workflowManager.getConflicts(fork, fork.getParent());
    }

    mergeDown = (forkId: number): void => {
        this.workflowManager.mergeDown(forkId);
        this.viewState.clearSelectedAggregates(forkId);
    }

    commandTitles: Array<Object> = [];
    getCommandTitles = (forkId: number): Array<Object> => {
        let current = this.commandBus.getCurrentCommandTitles(forkId);

        if (current.length > this.commandTitles.length) {
            const toAdd = current.slice(this.commandTitles.length, current.length);
            this.commandTitles = this.commandTitles.concat(toAdd.map((str) => { return { 'label': str }; }));
        } else if(current.length < this.commandTitles.length) {
            this.commandTitles = current.map((str) => { return { 'label': str }; });
        }
        return this.commandTitles;
    }

    getStackLengths = (forkId: number): Array<number> => {
        const fork = this.commandBus.getFork(forkId);
        return [fork.getArchive().length, fork.getCurrent().length];
    }

    clear = (forkId: number) => {
        this.workflowManager.clearCurrent(forkId);
        this.viewState.clearSelectedAggregates(forkId);
    }

    optimize = (forkId: number) => {
        this.workflowManager.optimize(forkId);
        this.viewState.clearSelectedAggregates(forkId);
    }

    resolveConflict = (conflict: CommandConflict, resolution: Resolution): void => {
        const fromForkId = this.getForkNum();

        if (resolution === Resolution.Parent) {
            this.commandBus.executeCommand(fromForkId, conflict.toCommand);
        }
        // If we chose the child, it would get applied after and overwrite when the merge is complete
        // else if (resolution === Resolution.Child) {
        //     this.commandBus.executeCommand(toForkId, conflict.fromCommand);
        // }
        this.conflicts.splice(this.conflicts.indexOf(conflict), 1);
    }
}