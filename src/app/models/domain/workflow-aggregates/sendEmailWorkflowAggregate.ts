import { WorkflowAggregate } from './workflowAggregate';
import { TypeInjector } from '../../../services/type-injector.service';

export class SendEmailWorkflowAggregate extends WorkflowAggregate {

    constructor(hash: string) {
        super(hash);

        this.events = {
            "onSuccess": [],
            "onFail": []
        };
    }

    sendTo: string;

    subject: string;

    message: string;

    name = "Send Email";
}

TypeInjector.put(SendEmailWorkflowAggregate.prototype.constructor.name, SendEmailWorkflowAggregate);