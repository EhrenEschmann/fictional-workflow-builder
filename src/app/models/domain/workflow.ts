import { WorkflowAggregate } from '../domain/workflow-aggregates/workflowAggregate';

export class Workflow {

    private name: string;
    private root: Array<WorkflowAggregate>;

    constructor(name?: string) {
        this.name = name;
        this.root = [];
    }

    setName = (name: string) => {
        this.name = name;
    }

    rootAggregate = (): Array<WorkflowAggregate> => {
        return this.root;
    }

}