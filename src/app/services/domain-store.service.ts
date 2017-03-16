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
        this.workflowForks.push(new Workflow(name));
    }

    load = () => {
        // TODO:  pass in information from database
    }

    fork = (fork: number): void => {
        this.workflowForks[fork] = new Workflow();
    }

    getWorkflow = (fork: number) : Workflow => {
        if(!this.workflowForks) return null;
        return this.workflowForks[fork];
    }
}