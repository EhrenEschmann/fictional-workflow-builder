import { Component, Input, OnInit } from '@angular/core';
import { WorkflowAggregate } from './models/domain/workflow-aggregates/workflowAggregate';
import { ViewState } from './services/view-state.service';

@Component({
    selector: 'fwb-tree-node',
    templateUrl: './app/tree-node.component.html'
})
export class TreeNodeComponent implements OnInit {
    @Input() fork: number;
    @Input() aggregate: WorkflowAggregate;

    constructor(private readonly viewState: ViewState) { }

    aggregateEvents = (): Array<string> => {
        return Object.keys(this.aggregate.events);
    }

    onSelectAggregate = (fork: number, aggregate: WorkflowAggregate, event: string, mouseEvent: MouseEvent): void => {
        this.viewState.selectedAggregate[fork] = aggregate;
        this.viewState.selectedEvent[fork] = event;
        // this.onSelectAggregate.emit([aggregate, event, mouseEvent]);
        console.log(aggregate, event);
        mouseEvent.stopPropagation();
    }

    ngOnInit() {
        console.log(this.aggregate);
    }
}