import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { DialogModule, ButtonModule, SplitButtonModule, InputTextModule, DropdownModule } from 'primeng/primeng';

import { AppComponent } from './app.component';
import { WorkflowComponent } from './workflow.component';
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
import { TypeStore } from './services/type-store.service';
import { CommandOptimizer } from './services/command-optimizer.service';
import { ValuesPipe } from './pipes/valuesPipe.pipe';
import { PropertyEditorComponent } from './property-editor.component';
// import { UUID } from 'angular2-uuid';
import './models/domain/workflow-aggregates/executeCompiledBinaryWorkflowAggregate';
import './models/domain/workflow-aggregates/postRestApiWorkflowAggregate';
import './models/domain/workflow-aggregates/sendEmailWorkflowAggregate';

import './models/commands/moveWorkflowAggregateToTargetCommand';
import './models/commands/moveWorkflowAggregateToRootCommand';
import './models/commands/createNewWorkflowAggregateCommand';
import './models/commands/updatePropertyCommand';

const appRoutes: Routes = [
  { path: 'app', component: AppComponent }
];

@NgModule({
  imports: [BrowserModule, FormsModule, RouterModule.forRoot(appRoutes), DialogModule,
    ButtonModule, SplitButtonModule, InputTextModule, DropdownModule],
  declarations: [AppComponent, WorkflowComponent, TreeComponent, TreeNodeComponent,
    PropertyEditorComponent, ValuesPipe],
  bootstrap: [AppComponent],
  providers: [QueryBus, HashGenerator, WindowRef, WorkflowManager, DomainStore,
    DomainCache, CommandStore, CommandBus, AggregateFactory, ViewState,
    TypeStore, CommandOptimizer]
})
export class AppModule { }