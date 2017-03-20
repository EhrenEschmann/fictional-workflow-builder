import { WorkflowAggregate } from './workflowAggregate';
import { Property } from '../property';
import { TypeStore } from '../../../services/type-store.service';

export class ExecuteCompiledBinaryWorkflowAggregate extends WorkflowAggregate {

    constructor(hash: string) {
        super(hash);

        this.events = {
            "onSuccess": [],
            "onFail": []
        };

        this.initializeProperties();
    }

    location: Property = new Property();

    parameters: Property = new Property();

    name = "Execute Compiled Binary";
}

TypeStore.put(ExecuteCompiledBinaryWorkflowAggregate.prototype.constructor.name, ExecuteCompiledBinaryWorkflowAggregate);