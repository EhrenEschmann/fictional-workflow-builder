import { Injectable } from '@angular/core';
import { Aggregate } from '../models/domain/aggregate';
import { Dictionary } from '../models/collections/dictionary';
import { HashGenerator } from './hash-generator.service';

@Injectable()
export class DomainCache {
    private cache: Array<Dictionary<Aggregate>>;

    constructor(
        private readonly hashGenerator: HashGenerator
    ) {
        this.cache = [];
    }

    createCache = (realityId: number) => {
        this.cache[realityId] = {};
    }

    insert = (realityId: number, hash: string, aggregate: Aggregate): void => {
        this.cache[realityId][hash] = aggregate;
    }

    remove = (realityId: number, hash: string): void => {
        delete this.cache[realityId][hash];
    }

    get = (realityId: number, hash: string): Aggregate => {
        return this.cache[realityId][hash];
    }
}