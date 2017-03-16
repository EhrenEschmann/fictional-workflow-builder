import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { TreeComponent } from './tree.component';
import { TreeNodeComponent } from './tree-node.component';
import { QueryBus } from './services/query-bus.service';
import { HashGenerator } from './services/hash-generator.service';
import { WindowRef } from './services/window-ref.service';
import { WorkflowManager } from './services/workflow-manager.service';
import { DomainStore } from './services/domain-store.service';
import { DomainCache } from './services/domain-cache.service';
import { CommandStore } from './services/command-store.service';
import { CommandBus } from './services/command-bus.service';
import { ViewState } from './services/view-state.service';
import { AggregateFactory } from './services/aggregate-factory.service';


import {TypeInjector} from './services/type-injector.service';
//import { UUID } from 'angular2-uuid';
import "./models/domain/workflow-aggregates/executeCompiledBinaryWorkflowAggregate";
import "./models/domain/workflow-aggregates/postRestApiWorkflowAggregate";
import "./models/domain/workflow-aggregates/sendEmailWorkflowAggregate";

import "./models/commands/addWorkflowAggregateToParentCommand";
import "./models/commands/addWorkflowAggregateToRootCommand";
import "./models/commands/createNewWorkflowAggregateCommand";

@NgModule({
  imports: [BrowserModule],
  declarations: [AppComponent, TreeComponent, TreeNodeComponent],
  bootstrap: [AppComponent],
  providers: [QueryBus, HashGenerator, WindowRef, WorkflowManager, DomainStore, DomainCache, CommandStore, CommandBus, AggregateFactory, ViewState, TypeInjector]
})
export class AppModule { }
