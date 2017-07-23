import { Injectable } from '@angular/core';
import { Aggregate } from '../models/domain/aggregate';
import { Workflow } from '../models/domain/workflow';
import { DomainCache } from './domain-cache.service';
import { DomainStore } from './domain-store.service';

@Injectable()
export class QueryBus {

  constructor(
    private readonly domainStore: DomainStore,
    private readonly domainCache: DomainCache
  ) { }

  getRootObject = (realityId: number): Workflow => {
    return this.domainStore.getWorkflow(realityId);
  }

  getRootObjects = (): Array<Workflow> => {
    return this.domainStore.getRealities();
  }

  getAggregate = (realityId: number, hash: string): Aggregate => {
    return this.domainCache.get(realityId, hash);
  }
}