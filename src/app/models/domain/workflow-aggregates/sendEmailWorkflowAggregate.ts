import { WorkflowAggregate } from './workflowAggregate';
import { Property } from '../property';
import { TypeStore } from '../../../services/type-store.service';

export class SendEmailWorkflowAggregate extends WorkflowAggregate {
    sendTo: Property = new Property();
    subject: Property = new Property();
    message: Property = new Property();
    name = 'Send Email';

    constructor(hash: string) {
        super(hash);

        this.events = {
            'onSuccess': [],
            'onFail': []
        };

        this.initializeProperties();
    }
}

TypeStore.put(SendEmailWorkflowAggregate);