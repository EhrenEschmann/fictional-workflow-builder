import { Injectable } from '@angular/core';
import { WorkflowAggregate } from '../models/domain/workflow-aggregates/workflowAggregate';
import { DomainCache } from '../services/domain-cache.service';
import { TypeStore } from '../services/type-store.service';

@Injectable()
export class AggregateFactory {

    constructor(private readonly domainCache: DomainCache) { }

    createAggregate = <T extends WorkflowAggregate>(aggregate: { new (hash: string): T; }, fork: number, hash: string): T => {
        let newAggregate: T;
        newAggregate = new aggregate(hash);
        this.domainCache.insert(fork, hash, newAggregate);
        return newAggregate;
    }

    createAggregateByType = (stringType: string, fork: number, hash: string): any => {
        let type = TypeStore.get(stringType);
        return this.createAggregate(type, fork, hash);
    }
}