import { Injectable } from '@angular/core';
import { Command } from '../models/commands/command';
import { CreateNewWorkflowAggregateCommand } from '../models/commands/createNewWorkflowAggregateCommand';
import { UpdatePropertyCommand } from '../models/commands/updatePropertyCommand';
import { Dictionary } from '../models/collections/dictionary';
import { AggregateCommandPartition } from '../models/command-domain/aggregateCommandPartition';
import { CommandType } from '../models/command-domain/commandType';

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
        var partitions: Dictionary<AggregateCommandPartition> = {};
        for (let i = 0; i < originalCommands.length; i++) {
            let command = originalCommands[i];
            var hash = command.aggregateHash();
            if (partitions[hash] === undefined)
                partitions[hash] = new AggregateCommandPartition(hash, i);

            this.updatePartition(partitions[hash], command);

            if (command instanceof CreateNewWorkflowAggregateCommand) {
                var nestedCommands = (command as CreateNewWorkflowAggregateCommand).updateCommands;

                for (let nestedCommand of nestedCommands)
                    this.updatePartition(partitions[hash], nestedCommand);

                (command as CreateNewWorkflowAggregateCommand).updateCommands = [];
            }
        }
        return partitions;
    }

    private pruneDeletedDependencies(partitions: Dictionary<AggregateCommandPartition>): Dictionary<AggregateCommandPartition> {
        var prunedPartitions: Dictionary<AggregateCommandPartition> = {};
        for (let hash in partitions) {
            if (!partitions[hash].deleted())
                if (partitions[hash].getParentAggregateHash() === undefined) // signals root level aggregateCommandPartition
                    prunedPartitions[hash] = partitions[hash];
                else if (prunedPartitions[partitions[hash].getParentAggregateHash()])
                    prunedPartitions[hash] = partitions[hash];
        }
        return prunedPartitions;
    }

    optimize = (originalCommands: Array<Command>): Array<Command> => {
        var partitions: Dictionary<AggregateCommandPartition> = this.partition(originalCommands);
        partitions = this.pruneDeletedDependencies(partitions);
        for (let hash in partitions) {
            partitions[hash].consolidateUpdates();
        }
        var optimizedStack: Array<Command> = [];
        for (let hash in partitions) {
            optimizedStack = optimizedStack.concat(partitions[hash].getOrderedCommands());
        }
        return optimizedStack;
    }
}