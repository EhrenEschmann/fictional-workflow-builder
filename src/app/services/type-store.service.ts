import { Injectable } from '@angular/core';
import { Dictionary } from '../models/collections/dictionary';
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