import { Injectable } from '@angular/core';
import { WorkflowAggregate } from '../models/domain/workflow-aggregates/workflowAggregate';
import { SendEmailWorkflowAggregate } from '../models/domain/workflow-aggregates/sendEmailWorkflowAggregate';
import { DomainCache } from '../services/domain-cache.service';
import { TypeStore } from '../services/type-store.service';

@Injectable()
export class AggregateFactory {

    constructor(private readonly domainCache: DomainCache) { }

    createAggregate = <T extends WorkflowAggregate>(aggregate: { new (hash: string): T; }, fork: number, hash: string): T => {
        var newAggregate: T;
        newAggregate = new aggregate(hash);
        this.domainCache.insert(fork, hash, newAggregate);
        return newAggregate;
    }

    createAggregateByType = (stringType: string, fork: number, hash: string): any => {
        var type = TypeStore.get(stringType);
        return this.createAggregate(type, fork, hash);
    }
}
