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
    @Input() fork: number;
    @Input() aggregates: Array<WorkflowAggregate>;

    constructor(
        private readonly viewState: ViewState,
        private readonly commandBus: CommandBus
    ) { }

    onSelectAggregate = (fork: number, aggregate: WorkflowAggregate, mouseEvent: MouseEvent): void => {
        this.viewState.selectedAggregate[fork] = aggregate;
        this.viewState.selectedEvent[fork] = null;
        // this.onSelectAggregate.emit([aggregate, event, mouseEvent]);
        console.log(aggregate);
        mouseEvent.stopPropagation();
    }

    updateProperty(forkId: number, aggregate: WorkflowAggregate, propertyKey: string, newValue: string) {
        console.log(forkId, aggregate, propertyKey, newValue);
        const command = new UpdatePropertyCommand(aggregate.getHash(), propertyKey, newValue);
        this.commandBus.executeCommand(forkId, command);
    }

    deleteAggregate = (forkId: number, aggregateHash: string): void => {
        const command = new DeleteWorkflowAggregateCommand(aggregateHash);
        this.commandBus.executeCommand(forkId, command);
        this.viewState.clearSelectedAggregates(forkId);
    }

    onDragStart = ($event: any, draggingAggregate: WorkflowAggregate) => {
        console.log($event, draggingAggregate);
        this.viewState.setDraggedAggregate(draggingAggregate);
    }

    // onDragEnd = ($event: any, draggingAggregate: WorkflowAggregate) => { // TODO:  May not be needed????
    //     console.log($event, draggingAggregate);
    //     this.viewState.setDraggedAggregate(undefined);
    // }
}