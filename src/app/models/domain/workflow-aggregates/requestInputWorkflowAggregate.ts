import { WorkflowAggregate } from './workflowAggregate';
import { Property } from '../property';
import { TypeStore } from '../../../services/type-store.service';

export class RequestInputWorkflowAggregate extends WorkflowAggregate {
    user: Property = new Property();
    timeoutDuration: Property = new Property();
    name = 'Request Input';
    type: string = this.constructor.name;

    constructor(hash: string) {
        super(hash);

        this.events = {
            'onSuccess': [],
            'onTimeout': [],
            'onFail': []
        };

        this.initializeProperties();
    }
}

TypeStore.put(RequestInputWorkflowAggregate);