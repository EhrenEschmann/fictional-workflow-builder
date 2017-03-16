import { Injectable } from '@angular/core';
import { CommandStore } from "./command-store.service";
import { CommandBus } from "./command-bus.service";
import { DomainStore } from "./domain-store.service";
import { DomainCache } from "./domain-cache.service";
import { Workflow } from "../models/domain/workflow";

@Injectable()
export class WorkflowManager {

    constructor(private readonly commandStore: CommandStore,
        private readonly commandBus: CommandBus,
        private readonly domainStore: DomainStore,
        private readonly domainCache: DomainCache
    ) { }

    createWorkflow = (name: string) => {
        name = "TODO_temp"
        this.domainStore.create(name);
        this.commandStore.startMainLine();
        this.domainCache.createCache(0);
    }

    loadWorkflow = () => {

        // TODO: get from database

        // TODO: hardcode from app.component for now.

        //var 
    }

    forkWorkflow = () => {

    }

    mergeWorkflow = () => {

    }



}