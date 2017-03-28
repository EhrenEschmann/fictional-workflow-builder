import { Injectable } from '@angular/core';
import { Workflow } from '../models/domain/workflow';
import { AggregateRoot } from '../models/domain/aggregateRoot';
import { Dictionary } from '../models/collections/dictionary';
import { HashGenerator } from './hash-generator.service';
import { DomainCache } from './domain-cache.service';

@Injectable()
export class DomainStore {
    private workflowForks: Array<Workflow>;

    constructor(private readonly domainCache: DomainCache) { }

    create = (name: string) => {
        this.workflowForks = [];
        this.workflowForks.push(new Workflow(0, undefined, name));
    }

    load = () => {
        // TODO:  pass in information from database
    }

    fork = (fromFork: number): number => {
        let newForkId = this.workflowForks.length;
        this.workflowForks.push(new Workflow(newForkId, fromFork, `fork from ${fromFork}`));
        return this.workflowForks.length -1;
    }

    getWorkflow = (fork: number): Workflow => {
        if (!this.workflowForks) return null;
        return this.workflowForks[fork];
    }

    getForks = () : Array<Workflow> => {
        return this.workflowForks;
    }

    isLoaded = (): boolean => {
        return !(this.workflowForks === undefined);
    }

    // TODO:  Dont HAVE to do this; just display for good measure.
    clear = (forkId: number): void => {
        let name = this.workflowForks[forkId].getName();
        let forkFrom = this.workflowForks[forkId].getParent();
        this.workflowForks[forkId] = new Workflow(forkId, forkFrom, name);
    }
}