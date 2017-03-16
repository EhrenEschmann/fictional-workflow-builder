import { Dictionary } from '../../collections/dictionary';
import { AggregateRoot } from '../aggregateRoot';

export abstract class WorkflowAggregate implements AggregateRoot {

    constructor(public hash: string) {
        this.initializeProperties();
     }

    abstract name: string;

    properties: Dictionary<any>;

    protected initializeProperties = (): void => {
        let aggregate: WorkflowAggregate = this;
        this.properties = {};
        for (let propertyName in aggregate) {
            if (aggregate.hasOwnProperty(propertyName)) {
                if (propertyName != "events") {
                    var property = aggregate[propertyName];
                    this.properties[propertyName] = property;
                }
            }
        }
    }

    events: Dictionary<Array<WorkflowAggregate>>;
}