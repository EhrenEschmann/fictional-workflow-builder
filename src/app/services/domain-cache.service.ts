import { Injectable } from '@angular/core';
import { AggregateRoot } from '../models/domain/aggregateRoot';
import { Dictionary } from '../models/collections/dictionary';
import { HashGenerator } from './hash-generator.service';

@Injectable()
export class DomainCache {
    private cache: Array<Dictionary<AggregateRoot>>;

    constructor(
        private readonly hashGenerator: HashGenerator
    ) {
        this.cache = [];
    }

    createCache = (realityId: number) => {
        this.cache[realityId] = {};
    }

    insert = (realityId: number, hash: string, aggregateRoot: AggregateRoot): void => {
        this.cache[realityId][hash] = aggregateRoot;
    }

    remove = (realityId: number, hash: string): void => {
        delete this.cache[realityId][hash];
    }

    get = (realityId: number, hash: string): AggregateRoot => {
        return this.cache[realityId][hash];
    }
}