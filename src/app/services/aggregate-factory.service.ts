import { Injectable } from '@angular/core';
import { WorkflowAggregate } from '../models/domain/workflow-aggregates/workflowAggregate';
import { DomainCache } from '../services/domain-cache.service';
import { TypeStore } from '../services/type-store.service';

@Injectable()
export class AggregateFactory {

    constructor(
        private readonly domainCache: DomainCache
    ) { }

    createAggregate = <T extends WorkflowAggregate>(aggregate: { new (hash: string): T; }, realityId: number, hash: string): T => {
        if (this.domainCache.get(realityId, hash))
            throw new Error(`aggregate already exists at ${hash}`);
        const newAggregate = new aggregate(hash);
        this.domainCache.insert(realityId, hash, newAggregate);
        return newAggregate;
    }

    createAggregateByType = (stringType: string, realityId: number, hash: string): any => {
        const type = TypeStore.get(stringType);
        return this.createAggregate(type, realityId, hash);
    }

    invalidateCache = (realityId: number, hash: string): void => {
        this.domainCache.remove(realityId, hash);
    }
}