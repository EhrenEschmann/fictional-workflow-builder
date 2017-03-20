import { MergeType } from '../models/domain/mergeType';

export function MergeTypeAware(constructor: Function) {
    constructor.prototype.MergeType = MergeType;
}