import { Dictionary } from '../../collections/dictionary';
import { AggregateRoot } from '../aggregateRoot';
import { Property } from '../property';

export abstract class WorkflowAggregate implements AggregateRoot {

    constructor(private readonly hash: string) { }

    abstract name: string;
    parent: Array<WorkflowAggregate>;
    events: Dictionary<Array<WorkflowAggregate>>;
    properties: Dictionary<Property> = {};

    getHash = (): string => {
        return this.hash;
    }

    protected initializeProperties = (): void => {
        let aggregate: WorkflowAggregate = this;
        this.properties = {};
        for (let propertyName in aggregate) {
            if (aggregate.hasOwnProperty(propertyName)) {
                if (aggregate[propertyName] instanceof Property)
                    this.properties[propertyName] = aggregate[propertyName];
            }
        }
    }
}