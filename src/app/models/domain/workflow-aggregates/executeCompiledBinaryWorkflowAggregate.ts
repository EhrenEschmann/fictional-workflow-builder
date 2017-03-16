import { WorkflowAggregate } from './workflowAggregate';
import {TypeInjector} from '../../../services/type-injector.service';

export class ExecuteCompiledBinaryWorkflowAggregate extends WorkflowAggregate {

    constructor(hash: string) {
        super(hash);

        this.events = {
            "onSuccess": [],
            "onFail": []
        };
    }

    location: string;

    parameters: Array<string>;

    name = "Execute Compiled Binary";
}

TypeInjector.put(ExecuteCompiledBinaryWorkflowAggregate.prototype.constructor.name, ExecuteCompiledBinaryWorkflowAggregate);