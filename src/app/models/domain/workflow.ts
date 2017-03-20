import { WorkflowAggregate } from '../domain/workflow-aggregates/workflowAggregate';

export class Workflow {

    private root: Array<WorkflowAggregate>;

    constructor(private readonly forkFrom: number,
    private name?: string) {
        this.name = name;
        this.root = [];
    }

    setName = (name: string) => {
        this.name = name;
    }

    rootAggregate = (): Array<WorkflowAggregate> => {
        return this.root;
    }

    getParent = (): number => {
        return this.forkFrom;
    }
}