import { WorkflowAggregate } from './workflowAggregate';
import { Property } from '../property';
import { TypeStore } from '../../../services/type-store.service';

export class PostRestApiWorkflowAggregate extends WorkflowAggregate {

    constructor(hash: string) {
        super(hash);

        this.events = {
            "onSuccess": [],
            "onFail": []
        };

        this.initializeProperties();
    }

    url: Property = new Property();

    body: Property = new Property();

    name = "Post Rest API";
}

TypeStore.put(PostRestApiWorkflowAggregate.prototype.constructor.name, PostRestApiWorkflowAggregate);