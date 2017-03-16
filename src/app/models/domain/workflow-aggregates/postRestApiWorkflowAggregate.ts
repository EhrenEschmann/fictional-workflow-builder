import { WorkflowAggregate } from './workflowAggregate';
import {TypeInjector} from '../../../services/type-injector.service';

export class PostRestApiWorkflowAggregate extends WorkflowAggregate {

    constructor(hash: string) {
        super(hash);

        this.events = {
            "onSuccess": [],
            "onFail": []
        };
    }

    url: string;

    body: string;

    name = "Post Rest API";
}

TypeInjector.put(PostRestApiWorkflowAggregate.prototype.constructor.name, PostRestApiWorkflowAggregate);