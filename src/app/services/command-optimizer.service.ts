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
        let callback = (partition: AggregateCommandPartition): void => {
            if (partition.deleted()) {
                if (partition.created()) {
                    partition.clearCreate();
                    partition.clearDelete();
                }
                partition.clearUpdates();
                partition.clearMoves();
                partition.childrenPartitions = {};
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
        let fromPartitions = this.consolidate(this.buildPartitionHashTable(fromCommands));
        let toPartitions = this.consolidate(this.buildPartitionHashTable(toCommands));
        let conflicts: Array<CommandConflict> = [];

        for (let fromHash in fromPartitions) {
            if (toPartitions[fromHash]) {
                if (!fromPartitions[fromHash].deleteCommand) {
                    if (toPartitions[fromHash].moveCommand) {
                        let toCommand = toPartitions[fromHash].moveCommand;
                        let fromCommand = fromPartitions[fromHash].moveCommand;
                        if (fromCommand && toCommand)
                            if (toCommand.generateHash() !== fromCommand.generateHash())
                                conflicts.push(new CommandConflict(fromPartitions[fromHash].moveCommand,
                                    toPartitions[fromHash].moveCommand));
                    }
                    for (let fromProperty in fromPartitions[fromHash].updateCommands) {
                        if (fromPartitions[fromHash].updateCommands.hasOwnProperty(fromProperty)) {
                            let toCommand = toPartitions[fromHash].updateCommands[fromProperty];
                            let fromCommand = fromPartitions[fromHash].updateCommands[fromProperty];
                            if (toCommand && toCommand.value !== fromCommand.value) {
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