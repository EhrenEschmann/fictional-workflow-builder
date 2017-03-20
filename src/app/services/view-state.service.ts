import { Injectable } from '@angular/core';
import { WorkflowAggregate } from '../models/domain/workflow-aggregates/workflowAggregate';
import { AggregateRoot } from '../models/domain/aggregateRoot';
import { Workflow } from '../models/domain/workflow';
import { DomainCache } from './domain-cache.service';
import { DomainStore } from './domain-store.service';

@Injectable()
export class ViewState {

  constructor() { 
    this.selectedAggregate = [];
    this.selectedEvent = [];
  }

  selectedAggregate: Array<WorkflowAggregate>;
  selectedEvent: Array<string>;

  clearSelectedAggregates = (fork: number) => {
    this.selectedAggregate[fork] = undefined;
    this.selectedEvent[fork] = undefined;
  }

}