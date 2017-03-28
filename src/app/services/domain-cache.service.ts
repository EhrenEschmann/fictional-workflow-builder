import { Injectable } from '@angular/core';
import { AggregateRoot } from '../models/domain/aggregateRoot';
import { Dictionary } from '../models/collections/dictionary';
import { HashGenerator } from './hash-generator.service';

@Injectable()
export class DomainCache {
    private cache: Array<Dictionary<AggregateRoot>>;

    constructor(private readonly hashGenerator: HashGenerator) {
        this.cache = [];
    }

    createCache = (fork: number) => {
        this.cache[fork] = {};
    }

    insert = (fork: number, hash: string, aggregateRoot: AggregateRoot): void => {
        this.cache[fork][hash] = aggregateRoot;
    }

    remove = (fork: number, hash: string): void => {
        delete this.cache[fork][hash];
    }

    get = (fork: number, hash: string): AggregateRoot => {
        return this.cache[fork][hash];
    }

    // getCache = (pageId: string | number, type?: any): Array<any> => {
    //     if (!type)
    //         return this.cache[pageId];
    //     return this.cache[pageId]
    //         .filter((cachedItem: CacheItem) => {
    //             if (!cachedItem.deleted && cachedItem.item instanceof type)
    //                 return cachedItem.item;
    //         });
    // }
}