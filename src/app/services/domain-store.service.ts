import { Injectable } from '@angular/core';
import { Workflow } from '../models/domain/workflow';
import { DomainCache } from './domain-cache.service';

@Injectable()
export class DomainStore {
    private workflowRealities: Array<Workflow>;

    constructor(
        private readonly domainCache: DomainCache
    ) { }

    create = (name: string) => {
        this.workflowRealities = [];
        this.workflowRealities.push(new Workflow(0, undefined, name));
    }

    load = () => {
        // TODO:  pass in information from database
    }

    fork = (fromRealityId: number): number => {
        let newRealityId = this.workflowRealities.length;
        this.workflowRealities.push(new Workflow(newRealityId, fromRealityId, `fork from ${fromRealityId}`));
        return this.workflowRealities.length - 1;
    }

    getWorkflow = (realityId: number): Workflow => {
        if (!this.workflowRealities) return null;
        return this.workflowRealities[realityId];
    }

    getRealities = (): Array<Workflow> => {
        return this.workflowRealities;
    }

    isLoaded = (): boolean => {
        return !(this.workflowRealities === undefined);
    }
}