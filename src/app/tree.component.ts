import { Component, Input, Output, EventEmitter } from '@angular/core';
import { WorkflowAggregate } from './models/domain/workflow-aggregates/workflowAggregate'
import { ViewState } from "./services/view-state.service";

@Component({
	selector: 'fwb-tree',
	templateUrl: './app/tree.component.html'
})
export class TreeComponent {
	@Input() aggregates: Array<WorkflowAggregate>;

	constructor(private readonly viewState: ViewState) { }

    onSelectAggregate = (aggregate: WorkflowAggregate, mouseEvent: MouseEvent): void => {
        this.viewState.selectedAggregate = aggregate;        
		this.viewState.selectedEvent = null;
        // this.onSelectAggregate.emit([aggregate, event, mouseEvent]);
        console.log(aggregate);
        mouseEvent.stopPropagation();
    }
}