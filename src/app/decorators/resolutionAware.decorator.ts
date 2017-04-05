import { Resolution } from '../models/domain/resolution';

export function ResolutionAware(constructor: Function) {
    constructor.prototype.Resolution = Resolution;
}