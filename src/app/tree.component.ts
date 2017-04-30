import { Component, Input } from '@angular/core';
import { WorkflowAggregate } from './models/domain/workflow-aggregates/workflowAggregate';
import { ViewState } from './services/view-state.service';
import { CommandBus } from './services/command-bus.service';
import { UpdatePropertyCommand } from './models/commands/updatePropertyCommand';
import { DeleteWorkflowAggregateCommand } from './models/commands/deleteWorkflowAggregateCommand';

@Component({
    selector: 'fwb-tree',
    templateUrl: './app/tree.component.html'
})
export class TreeComponent {
    @Input() realityId: number;
    @Input() aggregates: Array<WorkflowAggregate>;

    constructor(
        private readonly viewState: ViewState,
        private readonly commandBus: CommandBus
    ) { }

    onSelectAggregate = (realityId: number, aggregate: WorkflowAggregate, mouseEvent: MouseEvent): void => {
        this.viewState.setSelectedAggregate(aggregate, undefined, realityId);
        // this.onSelectAggregate.emit([aggregate, event, mouseEvent]);
        console.log(aggregate);
        mouseEvent.stopPropagation();
    }

    updateProperty(realityId: number, aggregate: WorkflowAggregate, propertyKey: string, newValue: string) {
        console.log(realityId, aggregate, propertyKey, newValue);
        const command = new UpdatePropertyCommand(aggregate.getHash(), propertyKey, newValue);
        this.commandBus.executeCommand(realityId, command);
    }

    deleteAggregate = (realityId: number, aggregateHash: string): void => {
        const command = new DeleteWorkflowAggregateCommand(aggregateHash);
        this.commandBus.executeCommand(realityId, command);
        this.viewState.clearSelectedAggregates(realityId);
    }

    onDragStart = ($event: DragEvent, draggingAggregate: WorkflowAggregate) => {
        console.log($event, draggingAggregate);
        this.viewState.setDraggedAggregate(draggingAggregate);
    }
}