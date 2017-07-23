import { Injectable } from '@angular/core';
import { CommandStore } from './command-store.service';
import { CommandBus } from './command-bus.service';
import { DomainStore } from './domain-store.service';
import { DomainCache } from './domain-cache.service';
import { CommandReality } from '../models/command-domain/commandReality';
import { Command } from '../models/commands/command';
import { CommandOptimizer } from './command-optimizer.service';
import { CommandConflict } from '../models/command-domain/commandConflict';

// import { CreateNewWorkflowAggregateCommand } from '../models/commands/createNewWorkflowAggregateCommand';
// import { MoveWorkflowAggregateToTargetCommand } from '../models/commands/moveWorkflowAggregateToTargetCommand';
// import { UpdatePropertyCommand } from '../models/commands/updatePropertyCommand';

// TODO:  The public contract should all exist on the command or querybus (commandBus.initialize(), queryBus.initialize())
@Injectable()
export class WorkflowManager {

    constructor(
        private readonly commandStore: CommandStore,
        private readonly commandBus: CommandBus,
        private readonly domainStore: DomainStore,
        private readonly domainCache: DomainCache,
        private readonly commandOptimizer: CommandOptimizer
    ) { }

    createWorkflow = (name: string) => {
        name = 'TODO_temp';
        this.domainStore.create(name);
        this.commandStore.startMainLine();
        this.domainCache.createCache(0);
    }

    loadWorkflow = () => {
        // TODO: get from database

        // TODO: hardcode from app.component for now.

        // var 
    }

    canUndo = (realityId: number): boolean => {
        let reality = this.commandStore.findReality(realityId);

        return reality.getUndoLength() === 0;
    }

    canRedo = (realityId: number): boolean => {
        let reality = this.commandStore.findReality(realityId);

        return reality.getRedoLength() === 0;
    }

    private cloneCommands(commands: Array<Command>): Array<Command> {
        let cloned: Array<Command> = [];
        for (let i = 0; i < commands.length; i++) {
            cloned.push(commands[i].clone());
        }
        return cloned;
    }

    forkWorkflow = (fromRealityId: number) => {
        let domainRealityId = this.domainStore.fork(fromRealityId);
        let commandRealityId = this.commandStore.fork(fromRealityId);
        if (domainRealityId !== commandRealityId) throw new Error('inconsistent domain/command reality state');
        this.domainCache.createCache(domainRealityId);

        let commandReality = this.commandStore.findReality(fromRealityId);
        let newArchive: Array<Command> = this.cloneCommands(commandReality.getArchive().concat(commandReality.getCurrent()));

        for (let command of newArchive) {
            this.commandBus.executeCommand(domainRealityId, command, true);
        }
    }

    optimize = (realityId: number): void => {
        let originalCommands = this.commandBus.getReality(realityId).getCurrent();

        this.commandBus.undoCommand(realityId, originalCommands.length);

        let optimizedStack = this.cloneCommands(this.commandOptimizer.optimize(originalCommands));

        let warnings: Array<string> = []; // todo make type warning???
        for (let command of optimizedStack) {
            try {
                this.commandBus.executeCommand(realityId, command);
            } catch (e) {
                warnings.push(e);
                console.log(`Error:  ${e}`);
            }
        }
        if (warnings.length > 0) {
            console.log('optimization completed with warnings: ' + warnings);
        }
    }

    postOrderMergeUpWorkflow = (fromReality: CommandReality, toRealityId: number) => {
        let toReality = this.commandStore.findReality(toRealityId);
        let fromCommands = fromReality.getCurrent();
        let toCommands = toReality.getCurrent();

        let allCommands = this.cloneCommands(toCommands.concat(fromCommands));

        this.commandBus.clearCurrent(toRealityId);

        this.commandBus.clear(fromReality.getId());

        for (let command of allCommands) {
            try {
                this.commandBus.executeCommand(toRealityId, command);
            } catch (e) {
                console.log(`Error:  ${e}`);
            }
        }

        let newArchive = this.cloneCommands(toReality.getArchive().concat(toReality.getCurrent()));
        for (let command of newArchive) {
            try {
                this.commandBus.executeCommand(fromReality.getId(), command, true);
            } catch (e) {
                console.log(`Error:  ${e}`);
            }
        }
        fromReality.setArchive(newArchive);
    }

    getConflicts = (fromReality: CommandReality, toReality: CommandReality): Array<CommandConflict> => {
        return this.commandOptimizer.getConflicts(fromReality.getCurrent(), toReality.getCurrent());
    }

    mergeDown = (realityId: number) => {
        const reality = this.commandBus.getReality(realityId);

        const childrenRealities = reality.getChildren();

        for (let childReality of childrenRealities) {
            let commands = this.cloneCommands(reality.getArchive().concat(reality.getCurrent()));
            let childRealityId = childReality.getId();
            let originalCommands = this.cloneCommands(childReality.getCurrent());

            this.commandBus.clear(childReality.getId());

            for (let command of commands) {
                this.commandBus.executeCommand(childRealityId, command, true);
            }
            childReality.setArchive(commands);

            for (let originalCommand of originalCommands) {
                try {
                    this.commandBus.executeCommand(childRealityId, originalCommand);
                } catch (e) {
                    console.log(`Error:  ${e}`);
                }
            }
        }
    }

    clearCurrent = (realityId: number) => {
        this.commandBus.clearCurrent(realityId);
    }

    clearAll = (realityId: number) => {
        this.commandBus.clear(realityId);
    }

    isLoaded = (): boolean => {
        return this.domainStore.isLoaded();
    }

    deleteReality = (realityId: number): void => {
        this.domainStore.getRealities()[realityId] = undefined;
    }

//     test2 = (): void => {
//         [ 
//           Create("RequestInput"), Update("a0", "user", "@employee.manager"), Update("a0", "timeoutDuraction", "1 Week"), Move("a0", "root"), 
//           Create("ExecuteBinary"), Update("b0", "location", "C:\approve"), Update("b0", "parameters", "None"), Move("b0", "a0", "onSuccess"),
//           Create("SendEmail"), Update("c0", "sendTo", "@employee"), Update("c0", "subject", "Your PTO Request"), Update("c0", "message", "... Was approved."),  Move("c0", "b0", "onSuccess"),
//           Create("SendEmail"), Update("c1", "sendTo", "@hrManager"), Update("c0", "subject", "@employee's PTO Request"), Update("c0", "message", "... Was approved."),  Move("c1", "b0", "onSuccess"),
//           Create("PostRestApi"), Update("b1", "url", "/api/pto/approve"), Update("b1", "body", "{employee: @employee}"),  Move("b1", "a0", "onSuccess"),
//           Move("c0", "b1"), Delete("b0"), Update("a0", "timeoutDuraction", "1 Day")

        
//         ]
// var test2 =
//         {
//             a0 : {
//                 Create: Create("RequestInput"),  
//                 Move: Move("a0", "root"),
//                 Update: [ Update("a0", "user", "@employee.manager"), Update("a0", "timeoutDuraction", "1 Week"), Update("a0", "timeoutDuraction", "1 Day") ],
//                 Delete: undefined
//             },
//             b0 : {
//                 Create: Create("ExecuteBinary"),  
//                 Move: Move("b0", "a0", "onSuccess"),
//                 Update: [Update("b0", "location", "C:\approve"), Update("b0", "parameters", "None")],
//                 Delete: Delete("b0")
//             },
//             c0 : {
//                 Create: Create("SendEmail"),  
//                 Move:[Move("c0", "b0", "onSuccess"), Move("c0", "b1")]
//                 Update: [Update("c1", "sendTo", "@hrManager"), Update("c0", "subject", "@employee's PTO Request"), Update("c0", "message", "... Was approved.")]
//                 Delete: undefined
//             },
//             c1 : {
//                 Create: Create("SendEmail"),  
//                 Move: Move("c1", "b0", "onSuccess")
//                 Update: [Update("c1", "sendTo", "@hrManager"), Update("c0", "subject", "@employee's PTO Request"), Update("c0", "message", "... Was approved.")]
//                 Delete: undefined
//             },
//             b1 : {
//                 Create: Create("PostRestApi"),  
//                 Move:  Move("b1", "a0", "onSuccess"),
//                 Update: [Update("b1", "url", "/api/pto/approve"), Update("b1", "body", "{employee: @employee}")]
//                 Delete: undefined
//             },
//         }
//     }

//     var test4=         {
//             a0 : {
//                 Create: Create("RequestInput"),  
//                 Move: Move("a0", "root"),
//                 Update: [ Update("a0", "user", "@employee.manager"), Update("a0", "timeoutDuraction", "1 Day") ],
//                 Delete: undefined
//             },
//             c1 : {
//                 Create: Create("SendEmail"),  
//                 Move: Move("c1", "b0", "onSuccess")
//                 Update: [Update("c1", "sendTo", "@hrManager"), Update("c0", "subject", "@employee's PTO Request"), Update("c0", "message", "... Was approved.")]
//                 Delete: undefined
//             },
//             b1 : {
//                 Create: Create("PostRestApi"),  
//                 Move:  Move("b1", "a0", "onSuccess"),
//                 Update: [Update("b1", "url", "/api/pto/approve"), Update("b1", "body", "{employee: @employee}")]
//                 Delete: undefined
//             },
//         }
//     }

    // test = (): void => {
    //     const command =
    //         new CreateNewWorkflowAggregateCommand("RequestInput", "b0", [
    //             new MoveWorkflowAggregateToTargetCommand("a0", "onTimeout", "b0"),
    //             new UpdatePropertyCommand("b0", "user", "@employee.director"),
    //             new UpdatePropertyCommand("b0", "timeoutDuration", "1 Day"),
    //             new CreateNewWorkflowAggregateCommand("PostRestApi", "c0", [
    //                 new MoveWorkflowAggregateToTargetCommand("b0", "onSuccess", "c0"),
    //                 new UpdatePropertyCommand("c0", "url", "/api/pto/approve"),
    //                 new UpdatePropertyCommand("c0", "body", "{employee: @employee}"),
    //                 new CreateNewWorkflowAggregateCommand("SendEmail", "d0", [
    //                     new MoveWorkflowAggregateToTargetCommand("c0", "onSuccess", "d0"),
    //                     new UpdatePropertyCommand("d0", "sendTo", "@employee"),
    //                     new UpdatePropertyCommand("d0", "subject", "Your PTO Request"),
    //                     new UpdatePropertyCommand("d0", "message", " ... Was Approved."),
    //                 ])
    //             ]),
    //             new CreateNewWorkflowAggregateCommand("RequestInput", "c1", [
    //                 new MoveWorkflowAggregateToTargetCommand("b0", "onTimeout", "c1"),
    //                 new UpdatePropertyCommand("c1", "url", "/api/pto/reject"),
    //                 new UpdatePropertyCommand("c1", "body", "{employee: @employee}"),
    //                 new CreateNewWorkflowAggregateCommand("SendEmail", "d1", [
    //                     new MoveWorkflowAggregateToTargetCommand("c1", "onTimeout", "d1"),
    //                     new UpdatePropertyCommand("d1", "sendTo", "@employee"),
    //                     new UpdatePropertyCommand("d1", "subject", "Your PTO Request"),
    //                     new UpdatePropertyCommand("d1", "message", " ... Was Rejected.")
    //                 ])
    //             ]),
    //             new CreateNewWorkflowAggregateCommand("RequestInput", "c2", [
    //                 new MoveWorkflowAggregateToTargetCommand("b0", "onFail", "c2"),
    //                 new UpdatePropertyCommand("c2", "url", "/api/pto/reject"),
    //                 new UpdatePropertyCommand("c2", "body", "{employee: @employee}"),
    //                 new MoveWorkflowAggregateToTargetCommand("c2", "onTimeout", "d2"),
    //                 new UpdatePropertyCommand("d2", "sendTo", "@employee"),
    //                 new UpdatePropertyCommand("d2", "subject", "Your PTO Request"),
    //                 new UpdatePropertyCommand("d2", "message", " ... Was Rejected.")
    //             ])
    //         ]);
    // }

    // test2 = (): void => {
    //     const blob = {
    //         type: "RequestInputCommand",
    //         hash: "b0",
    //         user: "@employee.director",
    //         timeoutDuration: "1 Day",
    //         events: {
    //             onSuccess: [{
    //                 type: "PostRestApiCommand",
    //                 hash: "c0",
    //                 url: "/api/pto/approve",
    //                 body: "{employee: @employee}",
    //                 events: {
    //                     onSuccess: [{
    //                         type: "SendEmailCommand",
    //                         hash: "d0",
    //                         sendTo: "@employee",
    //                         subject: "Your PTO Request",
    //                         message: " ... Was Approved.",
    //                     }]
    //                 }
    //             }],
    //             onTimeout: [{
    //                 type: "PostRestApiCommand",
    //                 hash: "c1",
    //                 url: "/api/pto/reject",
    //                 body: "{employee: @employee}",
    //                 events: {
    //                     onSuccess: [{
    //                         type: "SendEmailCommand",
    //                         hash: "d1",
    //                         sendTo: "@employee",
    //                         subject: "Your PTO Request",
    //                         message: " ... Was Rejected.",
    //                     }]
    //                 }
    //             }],
    //             onFail: [{
    //                 type: "PostRestApiCommand",
    //                 hash: "c2",
    //                 url: "/api/pto/reject",
    //                 body: "{employee: @employee}",
    //                 events: {
    //                     onSuccess: [{
    //                         type: "SendEmailCommand",
    //                         hash: "d2",
    //                         sendTo: "@employee",
    //                         subject: "Your PTO Request",
    //                         message: " ... Was Rejected.",
    //                     }]
    //                 }
    //             }]
    //         }
    //     }
    //     const command = new BlobCommand(blob);
    // }
}