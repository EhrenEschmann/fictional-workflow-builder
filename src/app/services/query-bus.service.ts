import { Injectable } from '@angular/core';
import { AggregateRoot } from '../models/domain/aggregateRoot';
import { Workflow } from '../models/domain/workflow';
import { DomainCache } from './domain-cache.service';
import { DomainStore } from './domain-store.service';

@Injectable()
export class QueryBus {

  constructor(private readonly domainStore: DomainStore,
  private readonly domainCache: DomainCache) { }

  getRootObject = (fork: number): Workflow => {
    return this.domainStore.getWorkflow(fork)
  }

  getRootObjects = (): Array<Workflow> => {
    return this.domainStore.getForks();
  }

  getTypedAggregateRoot = <T>(fork: number, hash: string): T => {
    throw new Error('Not Built Yet.')
  }

  getAggregateRoot = (fork: number, hash: string): AggregateRoot => {
    return this.domainCache.get(fork, hash);
  }

  query = (target: AggregateRoot, query: Array<string>): any => {
    if(query[0])
      return this.query(target[query[0]], query.slice(1));
  }
}