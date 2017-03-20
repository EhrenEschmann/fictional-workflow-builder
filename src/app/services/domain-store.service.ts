import { Injectable } from '@angular/core';
import { Workflow } from "../models/domain/workflow";
import { AggregateRoot } from "../models/domain/aggregateRoot";
import { Dictionary } from "../models/collections/dictionary";
import { HashGenerator } from "./hash-generator.service";
import { DomainCache } from "./domain-cache.service";

@Injectable()
export class DomainStore {
    private workflowForks: Array<Workflow>;

    constructor(private readonly domainCache: DomainCache) { }

    create = (name: string) => {
        this.workflowForks = [];
        this.workflowForks.push(new Workflow(undefined, name));
    }

    load = () => {
        // TODO:  pass in information from database
    }

    fork = (fromFork: number): number => {
        this.workflowForks.push(new Workflow(fromFork, `fork from ${fromFork}`));
        return this.workflowForks.length-1;
    }

    getWorkflow = (fork: number): Workflow => {
        if (!this.workflowForks) return null;
        return this.workflowForks[fork];
    }

    getForks = () :Array<Workflow> => {
        return this.workflowForks;
    }

    isLoaded = (): boolean => {
        return !(this.workflowForks == undefined);
    }
}