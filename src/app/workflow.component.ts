import { Component, Input } from '@angular/core';
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
import { MergeType } from './models/domain/mergeType';
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
export class WorkflowComponent {
    @Input() workflow: Workflow;
    // aggregates: Array<WorkflowAggregate>;

    private mergeDialogDisplayed: boolean = false;

    constructor(private readonly hashGenerator: HashGenerator,
        private readonly workflowManager: WorkflowManager,
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
        private readonly viewState: ViewState) { }


    canUndo = (forkId: number): boolean => {
        return this.workflowManager.canUndo(forkId);
    }

    undo = (fork: number, count: number): void => {
        this.commandBus.undoCommand(fork, count);
        this.viewState.clearSelectedAggregates(fork);
        // var selectedAggregate = this.viewState.selectedAggregate[fork];
        // if (selectedAggregate) {
        //     var parentExists = this.queryBus.getAggregateRoot(fork, selectedAggregate.getHash());
        //     if (!parentExists)
        //         this.viewState.clearSelectedAggregates(fork);
        // }
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

    addAggregate = (fork: number, parent: WorkflowAggregate, event: string, aggregateType: string): void => {
        // var selectedAggregate = this.viewState.selectedAggregate;
        aggregateType = 'PostRestApiWorkflowAggregate';

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

    // merge = (forkId: number, type: MergeType) => {
    //     console.log(`Merge ${forkId} with type ${type}`);
    //     let fork = this.commandBus.getFork(forkId);
    //     switch (type) {
    //         case MergeType.PreOrder:
    //             this.workflowManager.firstOrderMergeWorkflow(forkId);
    //             break;
    //         case MergeType.PostOrder:
    //             this.workflowManager.postOrderMergeWorkflow(fork, fork.getParent().getId());
    //             break;
    //         case MergeType.ByAggregate:

    //     }
    //     this.mergeDialogDisplayed = false;
    // }

    // merge = (forkId: number) => {

    // }

    attemptMergeDown = (forkId: number) => {
        this.updateConflicts(forkId);
        if (this.conflicts.length > 0) {
            this.mergeDialogDisplayed = true;
        } else {
            this.mergeDown(forkId);
        }
    }

    mergeDown = (forkId: number) => {
        let fork = this.commandBus.getFork(forkId);
        this.workflowManager.postOrderMergeWorkflow(fork, fork.getParent().getId());
    }

    private conflicts: Array<CommandConflict> = [];
    updateConflicts = (forkId: number): void => {
        const fork = this.commandBus.getFork(forkId);
        this.conflicts = this.workflowManager.getConflicts(fork, fork.getParent());
        // if (this.conflicts.length === 0)
        //     this.workflowManager.mergeDown(fork, fork.getParent());
        // else {
        //     // resolve conflicts
        // }
    }

    mergeUp = (forkId: number): void => {
        this.workflowManager.mergeUp(forkId);
    }

    getCommandTitles = (forkId: number): Array<string> => {
        return this.commandBus.getCommandArchive(forkId);
    }

    getStackLengths = (forkId: number): Array<number> => {
        //  const currentFork = this.queryBus.getRootObject(forkId);
        //  const lengths: Array<number> = [currentFork.];
        const fork = this.commandBus.getFork(forkId);
        return [fork.getArchive().length, fork.getCurrent().length];
        //     lengths.push(this.commandBus.getCommandArchive(currentFork.getForkId()).length);

        //     while (currentFork !== undefined) {
        //         if (currentFork.getParent() !== undefined) {
        //             lengths.push(this.commandBus.getFork(currentFork.getForkId()).getStart());
        //         }
        //         currentFork = this.queryBus.getRootObject(currentFork.getParent());
        //     }

        //     return lengths.reverse();
    }

    clear = (forkId: number) => {
        this.workflowManager.clear(forkId);
        this.viewState.clearSelectedAggregates(forkId);
    }

    // wasMerged = (forkId: number): boolean => {
    //     let fork = this.commandBus.getFork(forkId);
    //     return fork.wasMerged();
    // }

    optimize = (forkId: number) => {
        this.workflowManager.optimize(forkId);
    }

    resolve = (conflict: CommandConflict, resolution: Resolution): void => {
        const fromForkId = this.getForkNum();
        const toForkId = this.getParentId(fromForkId);

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