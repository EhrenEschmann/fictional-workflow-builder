import { Injectable } from '@angular/core';
import { Command } from '../models/commands/command';
import { CreateNewWorkflowAggregateCommand } from '../models/commands/createNewWorkflowAggregateCommand';
import { UpdatePropertyCommand } from '../models/commands/updatePropertyCommand';
import { Dictionary } from '../models/collections/dictionary';
import { AggregateCommandPartition, ConsolidatedAggregateCommandPartition } from '../models/command-domain/aggregateCommandPartition';
import { CommandType } from '../models/command-domain/commandType';
import { CommandConflict } from '../models/command-domain/commandConflict';

@Injectable()
export class CommandOptimizer {
    private updatePartition(partition: AggregateCommandPartition, command: Command): void {
        switch (command.type) {
            case CommandType.Create:
                partition.addCreateCommand(command as CreateNewWorkflowAggregateCommand);
                break;
            case CommandType.Move:
                partition.addMoveCommand(command as any);
                break;
            case CommandType.Update:
                partition.addUpdateCommand(command as UpdatePropertyCommand);
                break;
            case CommandType.Delete:
                partition.addDeleteCommand(command);
                break;
        }
    }

    private buildPartitionHashTable(originalCommands: Array<Command>): Dictionary<AggregateCommandPartition> {
        let partitions: Dictionary<AggregateCommandPartition> = {};
        for (let i = 0; i < originalCommands.length; i++) {
            let command = originalCommands[i];
            let hash = command.aggregateHash();
            if (partitions[hash] === undefined)
                partitions[hash] = new AggregateCommandPartition(hash, i);

            this.updatePartition(partitions[hash], command);
        }
        return partitions;
    }

    private buildPartitionTree(originalCommands: Array<Command>): Dictionary<AggregateCommandPartition> {
        let partitions: Dictionary<AggregateCommandPartition> = {};
        let partitionsArray: Array<AggregateCommandPartition> = [];
        for (let i = 0; i < originalCommands.length; i++) {
            let command = originalCommands[i];
            let hash = command.aggregateHash();
            if (partitions[hash] === undefined) {
                let partition = new AggregateCommandPartition(hash, i);
                partitions[hash] = partition;
                partitionsArray.push(partition);
            }

            this.updatePartition(partitions[hash], command);
        }

        let partitionTree: Dictionary<AggregateCommandPartition> = {};
        // for (let i = partitionsArray.length - 1; i >= 0; i--) {
        for (let i = 0; i < partitionsArray.length; i++) {
            let hash = partitionsArray[i].getHash();
            let parentHash = partitionsArray[i].getParentAggregateHash();
            if (parentHash !== undefined) {
                partitions[parentHash].childrenPartitions[hash] = partitionsArray[i];
            } else {
                partitionTree[hash] = partitionsArray[i];
            }
        }

        return partitionTree;
    }

    private traversePartitionTreeDepthFirst(
        partitionTree: Dictionary<AggregateCommandPartition>, callback: (partition: AggregateCommandPartition) => void): void {
        for (let hash in partitionTree) {
            if (partitionTree.hasOwnProperty(hash)) {
                callback(partitionTree[hash]);
                this.traversePartitionTreeDepthFirst(partitionTree[hash].childrenPartitions, callback);
            }
        }
    }

    private pruneDeletedDependencies(partitions: Dictionary<AggregateCommandPartition>): Dictionary<AggregateCommandPartition> {
        // let prunedPartitions: Dictionary<AggregateCommandPartition> = {};
        let callback = (partition: AggregateCommandPartition): void => {
            // let hash = partition.getHash();
            if (partition.deleted()) {
                if (partition.created()) {
                    partition.clearCreate();
                    partition.clearDelete();
                }
                partition.clearUpdates();
                partition.clearMoves();
                partition.childrenPartitions = {}; // clear children
            }
        };

        this.traversePartitionTreeDepthFirst(partitions, callback);
        return partitions;
    }

    private consolidate(partitions: Dictionary<AggregateCommandPartition>): Dictionary<ConsolidatedAggregateCommandPartition> {
        let consolidated: Dictionary<ConsolidatedAggregateCommandPartition> = {};
        let callback = (partition: AggregateCommandPartition): void => {
            let hash = partition.getHash();
            consolidated[hash] = partition.getConsolidated();

        };
        this.traversePartitionTreeDepthFirst(partitions, callback);
        return consolidated;
    }

    flattenCommandStack = (originalCommands: Array<Command>): Array<Command> => {
        for (let i = 0; i < originalCommands.length; i++) {
            let command = originalCommands[i];

            if (command instanceof CreateNewWorkflowAggregateCommand) {
                let nestedCommands = (command as CreateNewWorkflowAggregateCommand).updateCommands;
                (command as CreateNewWorkflowAggregateCommand).updateCommands = [];
                originalCommands = originalCommands.slice(0, i + 1).concat(nestedCommands).concat(originalCommands.slice(i + 1));
            }
        }
        return originalCommands;
    }

    optimize = (originalCommands: Array<Command>): Array<Command> => {
        originalCommands = this.flattenCommandStack(originalCommands);
        let partitions = this.buildPartitionTree(originalCommands);
        partitions = this.pruneDeletedDependencies(partitions);
        let consolidatedPartitions = this.consolidate(partitions);
        let optimizedStack: Array<Command> = [];
        for (let hash in consolidatedPartitions) {
            if (consolidatedPartitions.hasOwnProperty(hash)) {
                optimizedStack = optimizedStack.concat(consolidatedPartitions[hash].getOrderedCommands());
            }
        }
        const intersection = originalCommands.filter((c: Command) => optimizedStack.indexOf(c) !== -1);
        return intersection;
    }

    getConflicts = (fromCommands: Array<Command>, toCommands: Array<Command>): Array<CommandConflict> => {
        let fromPartitions = this.consolidate(this.buildPartitionHashTable(fromCommands)); // buildPartitionTree
        // fromPartitions = this.consolidate(fromPartitions);
        let toPartitions = this.consolidate(this.buildPartitionHashTable(toCommands)); // buildPartitionTree
        // toPartitions = toPartitions);

        let conflicts: Array<CommandConflict> = [];
        for (let fromHash in fromPartitions) {
            // TODO:  Also check for moves, updates to objects that dont exist anymore in toParititions
            // TODO:  If we start with toParitions, will we have to worry about this extra case?
            if (toPartitions[fromHash]) { // if there was a change in both realities
                // 1.  Cant both have a create; auto-merge deletes
                if (!fromPartitions[fromHash].deleteCommand) {
                    // TODO:  don't need to do this if there are deletes:
                    // 2. Check for Move conflict
                    if (toPartitions[fromHash].moveCommand) { // possible conflict
                        let toCommand = toPartitions[fromHash].moveCommand;
                        let fromCommand = fromPartitions[fromHash].moveCommand;
                        if (fromCommand && toCommand)
                            if (toCommand.generateHash() !== fromCommand.generateHash()) // conflict
                                conflicts.push(new CommandConflict(fromPartitions[fromHash].moveCommand,
                                    toPartitions[fromHash].moveCommand));
                    }
                    // 3.  check for update conflict
                    for (let fromProperty in fromPartitions[fromHash].updateCommands) {
                        if (fromPartitions[fromHash].updateCommands.hasOwnProperty(fromProperty)) {
                            let toCommand = toPartitions[fromHash].updateCommands[fromProperty];
                            let fromCommand = fromPartitions[fromHash].updateCommands[fromProperty];
                            if (toCommand && toCommand.value !== fromCommand.value) { // conflict
                                conflicts.push(new CommandConflict(fromPartitions[fromHash].updateCommands[fromProperty],
                                    toPartitions[fromHash].updateCommands[fromProperty]));
                            }
                        }
                    }
                }
            }
        }
        return conflicts;
    }
}