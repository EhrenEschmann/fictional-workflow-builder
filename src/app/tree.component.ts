import { Component, Input, Output, EventEmitter } from '@angular/core';
import { WorkflowAggregate } from './models/domain/workflow-aggregates/workflowAggregate';
import { ViewState } from "./services/view-state.service";
import { CommandBus } from "./services/command-bus.service";
import { UpdatePropertyCommand } from "./models/commands/updatePropertyCommand";
import { DeleteWorkflowAggregateCommand } from "./models/commands/deleteWorkflowAggregateCommand";

@Component({
    selector: 'fwb-tree',
    templateUrl: './app/tree.component.html'
})
export class TreeComponent {
    @Input() fork: number;
    @Input() aggregates: Array<WorkflowAggregate>;

    constructor(private readonly viewState: ViewState,
        private readonly commandBus: CommandBus) { }

    onSelectAggregate = (fork: number, aggregate: WorkflowAggregate, mouseEvent: MouseEvent): void => {
        this.viewState.selectedAggregate[fork] = aggregate;
        this.viewState.selectedEvent[fork] = null;
        // this.onSelectAggregate.emit([aggregate, event, mouseEvent]);
        console.log(aggregate);
        mouseEvent.stopPropagation();
    }

    updateProperty(fork: number, aggregate: WorkflowAggregate, propertyKey: string, newValue: string) {
        console.log(fork, aggregate, propertyKey, newValue);
        var command = new UpdatePropertyCommand(aggregate.getHash(), propertyKey, newValue);
        this.commandBus.executeCommand(fork, command, true);
    }

    deleteAggregate = (fork: number, aggregateHash: string): void => {
        var command = new DeleteWorkflowAggregateCommand(aggregateHash);
        this.commandBus.executeCommand(fork, command, true);
    }
}