import { Component, Input, OnInit } from '@angular/core';
import { WorkflowAggregate } from './models/domain/workflow-aggregates/workflowAggregate';
import { ViewState } from './services/view-state.service';
import { MoveWorkflowAggregateToTargetCommand } from './models/commands/moveWorkflowAggregateToTargetCommand';
import { CommandBus } from './services/command-bus.service';

@Component({
    selector: 'fwb-tree-node',
    templateUrl: './app/tree-node.component.html'
})
export class TreeNodeComponent implements OnInit {
    @Input() realityId: number;
    @Input() aggregate: WorkflowAggregate;

    constructor(
        private readonly viewState: ViewState,
        private readonly commandBus: CommandBus
    ) { }

    aggregateEvents = (): Array<string> => {
        return Object.keys(this.aggregate.events);
    }

    onSelectAggregate = (realityId: number, aggregate: WorkflowAggregate, event: string, mouseEvent: MouseEvent): void => {
        this.viewState.selectedAggregate[realityId] = aggregate;
        this.viewState.selectedEvent[realityId] = event;
        // this.onSelectAggregate.emit([aggregate, event, mouseEvent]);
        console.log(aggregate, event);
        mouseEvent.stopPropagation();
    }

    ngOnInit() {
        console.log(this.aggregate);
    }

    onDrop = (aggregate: WorkflowAggregate, eventName: string, $event: any) => {
        const draggingAggregate = this.viewState.draggedAggregate;

        if (aggregate === draggingAggregate) return;
        // prevent dropping parent as child

        let command = new MoveWorkflowAggregateToTargetCommand(aggregate.getHash(), eventName, draggingAggregate.getHash());
        this.commandBus.executeCommand(this.realityId, command);
    }
}