import { Component, Input } from '@angular/core';
import { WorkflowAggregate } from './models/domain/workflow-aggregates/workflowAggregate';
import { HashGenerator } from './services/hash-generator.service';
import { CreateNewWorkflowAggregateCommand } from './models/commands/createNewWorkflowAggregateCommand';
import { MoveWorkflowAggregateToTargetCommand } from './models/commands/moveWorkflowAggregateToTargetCommand';
import { MoveWorkflowAggregateToRootCommand } from './models/commands/moveWorkflowAggregateToRootCommand';
import { WorkflowManager } from './services/workflow-manager.service';
import { CommandBus } from './services/command-bus.service';
import { DomainStore } from './services/domain-store.service';
import { QueryBus } from './services/query-bus.service';
import { ViewState } from './services/view-state.service';
import { Workflow } from "./models/domain/workflow";
import { MergeType } from "./models/domain/mergeType";
import { MergeTypeAware } from "./decorators/mergeTypeAware.decorator";
import { Command } from "./models/commands/command";

@Component({
    selector: "fwb-workflow",
    templateUrl: "./app/workflow.component.html"
})
@MergeTypeAware
export class WorkflowComponent {
    @Input() workflow: Workflow;
    //aggregates: Array<WorkflowAggregate>;

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
        //var selectedAggregate = this.viewState.selectedAggregate;
        aggregateType = "PostRestApiWorkflowAggregate";

        var createCommand = new CreateNewWorkflowAggregateCommand(aggregateType, this.hashGenerator.createHash());
        var moveCommand = (parent && event)
            ? new MoveWorkflowAggregateToTargetCommand(parent.getHash(), event)
            : new MoveWorkflowAggregateToRootCommand();

        createCommand.updateCommands.push(moveCommand);
        this.commandBus.executeCommand(fork, createCommand);
    }

    getRootAggregates = (): Array<WorkflowAggregate> => {
        var forkId = this.getForkNum();
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

    merge = (forkId: number, type: MergeType) => {
        console.log(`Merge ${forkId} with type ${type}`);
        let fork = this.commandBus.getFork(forkId);
        switch (type) {
            case MergeType.FirstOrder:
                this.workflowManager.firstOrderMergeWorkflow(forkId);
                break;
            case MergeType.LastOrder:
                this.workflowManager.lastOrderMergeWorkflow(fork, fork.getParent().getId());
                break;
            case MergeType.ByAggregate:

        }
        this.mergeDialogDisplayed = false;
    }

    getCommandTitles = (forkId: number): Array<string> => {
        return this.workflowManager.getCommands(forkId).map((c: Command) => c.title);
    }

    getStackLengths = (forkId: number): Array<number> => {
        let lengths: Array<number> = [];
        let currentFork = this.queryBus.getRootObject(forkId);

        lengths.push(this.commandBus.getCommandArchive(currentFork.getForkId()).length);

        while (currentFork !== undefined) {
            if (currentFork.getParent() !== undefined) {
                lengths.push(this.commandBus.getFork(currentFork.getForkId()).getStart());
            }
            currentFork = this.queryBus.getRootObject(currentFork.getParent());
        }

        return lengths.reverse();
    }

    wasMerged = (forkId: number): boolean => {
        let fork = this.commandBus.getFork(forkId);
        return fork.wasMerged();
    }

    optimize = (forkId: number) => {
        this.workflowManager.optimize(forkId);
    }
}