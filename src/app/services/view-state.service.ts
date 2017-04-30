import { Injectable } from '@angular/core';
import { WorkflowAggregate } from '../models/domain/workflow-aggregates/workflowAggregate';

@Injectable()
export class ViewState {
  private selectedAggregate: Array<WorkflowAggregate>;
  private selectedEvent: Array<string>;
  lastSelectedRealityId: number;

  draggedAggregate: WorkflowAggregate;

  constructor() {
    this.selectedAggregate = [];
    this.selectedEvent = [];
  }

  setSelectedAggregate = (aggregate: WorkflowAggregate, event: string, realityId: number) => {
    this.selectedAggregate[realityId] = aggregate;
    this.selectedEvent[realityId] = event;
    this.lastSelectedRealityId = realityId;
  }

  getSelectedEvent = (realityId: number) => {
    return this.selectedEvent[realityId];
  }

  getSelectedAggregate = (realityId: number) => {
    return this.selectedAggregate[realityId];
  }

  clearSelectedAggregates = (realityId: number) => {
    this.selectedAggregate[realityId] = undefined;
    this.selectedEvent[realityId] = undefined;
  }

  setDraggedAggregate = (aggregate: WorkflowAggregate) => {
    this.draggedAggregate = aggregate;
  }
}