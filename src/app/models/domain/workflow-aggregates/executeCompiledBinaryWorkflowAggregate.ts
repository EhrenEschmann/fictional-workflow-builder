import { WorkflowAggregate } from './workflowAggregate';
import { Property } from '../property';
import { TypeStore } from '../../../services/type-store.service';

export class ExecuteCompiledBinaryWorkflowAggregate extends WorkflowAggregate {
    location: Property = new Property();
    parameters: Property = new Property();
    name = 'Execute Compiled Binary';

    constructor(hash: string) {
        super(hash);

        this.events = {
            'onSuccess': [],
            'onFail': []
        };

        this.initializeProperties();
    }
}

TypeStore.put(ExecuteCompiledBinaryWorkflowAggregate);