import { Injectable } from '@angular/core';
import { WorkflowAggregate } from '../models/domain/workflow-aggregates/workflowAggregate';
import { AggregateRoot } from '../models/domain/aggregateRoot';
import { Workflow } from '../models/domain/workflow';
import { Dictionary } from '../models/collections/dictionary';
import { DomainCache } from './domain-cache.service';
import { DomainStore } from './domain-store.service';

@Injectable()
export class TypeStore {

    private static types: Dictionary<any> = {};

    static put = (stringType: string, type: any) => {
        console.log(`Adding ${stringType} to dictionary`);
        TypeStore.types[stringType] = type;
    }

    static get = (stringType: string) => {
        if (!TypeStore.types[stringType])
            throw Error(`${stringType} does not exist in dictionary`);
        return TypeStore.types[stringType];
    }
}