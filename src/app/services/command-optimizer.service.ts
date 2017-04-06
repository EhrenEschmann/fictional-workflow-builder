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

    private partition(originalCommands: Array<Command>): Dictionary<AggregateCommandPartition> {
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

    private pruneDeletedDependencies(partitions: Dictionary<AggregateCommandPartition>): Dictionary<AggregateCommandPartition> {
        let prunedPartitions: Dictionary<AggregateCommandPartition> = {};
        for (let hash in partitions) {
            if (partitions[hash].deleted()) {
                if (!partitions[hash].created()) {
                    partitions[hash].clearUpdates();
                    partitions[hash].clearMoves();
                    prunedPartitions[hash] = partitions[hash];
                }
            } else if (!partitions[hash].deleted())
                if (partitions[hash].getParentAggregateHash() === undefined) { // signals root level aggregateCommandPartition
                    prunedPartitions[hash] = partitions[hash];
                    // } else if (prunedPartitions[partitions[hash].getParentAggregateHash()]) { <-- this is asking if a command
                        //  exists that creates its parent, but that wont exist on nested forks who don't store their parent information.
                } else {
                    const parentHash = partitions[hash].getParentAggregateHash();
                    // we can only prune here if getparentHash exists and it was deleted
                    if (!(partitions[parentHash] && partitions[parentHash].deleted())) {
                        prunedPartitions[hash] = partitions[hash];
                    }
                }
        }
        return prunedPartitions;
    }

    private consolidate(partitions: Dictionary<AggregateCommandPartition>): Dictionary<ConsolidatedAggregateCommandPartition> {
        let consolidated: Dictionary<ConsolidatedAggregateCommandPartition> = {};
        for (let hash in partitions) {
            if (partitions.hasOwnProperty(hash)) {
                consolidated[hash] = partitions[hash].getConsolidated();
            }
        }
        return consolidated;
    }

    flattenStack = (originalCommands: Array<Command>): Array<Command> => {
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
        // Flatten Stack???
        originalCommands = this.flattenStack(originalCommands);
        let partitions: Dictionary<AggregateCommandPartition> = this.partition(originalCommands);
        partitions = this.pruneDeletedDependencies(partitions);
        let consolidatedPartitions = this.consolidate(partitions);
        let optimizedStack: Array<Command> = [];
        for (let hash in consolidatedPartitions) {
            if (consolidatedPartitions.hasOwnProperty(hash)) {
                optimizedStack = optimizedStack.concat(consolidatedPartitions[hash].getOrderedCommands());
            }
        }
        return optimizedStack;
    }

    getConflicts = (fromCommands: Array<Command>, toCommands: Array<Command>): Array<CommandConflict> => {
        let fromPartitions = this.consolidate(this.partition(fromCommands));
        // fromPartitions = this.consolidate(fromPartitions);
        let toPartitions = this.consolidate(this.partition(toCommands));
        // toPartitions = toPartitions);

        let conflicts: Array<CommandConflict> = [];
        for (let fromHash in fromPartitions) {
            // TODO:  Also check for moves, updates to objects that dont exist anymore in toParititions
            // TODO:  If we start with toParitions, will we have to worry about this extra case?
            if (toPartitions[fromHash]) { // if there was a change in both forks
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