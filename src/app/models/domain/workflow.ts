import { WorkflowAggregate } from '../domain/workflow-aggregates/workflowAggregate';

export class Workflow {

    private root: Array<WorkflowAggregate>;

    constructor(
        private readonly realityId: number,
        private readonly fromRealityId: number,
        private name?: string
    ) {
        this.name = name;
        this.root = [];
    }

    getRealityId = () => {
        return this.realityId;
    }

    getName = () => {
        return this.name;
    }

    setName = (name: string) => {
        this.name = name;
    }

    rootAggregate = (): Array<WorkflowAggregate> => {
        return this.root;
    }

    getParent = (): number => {
        return this.fromRealityId;
    }
}