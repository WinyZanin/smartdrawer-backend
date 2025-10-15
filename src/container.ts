import { DevicesRepository } from './repositories/devices/DevicesRepository';
import { DevicesService } from './services/devices/DevicesService';
import { CommandsRepository } from './repositories/commands/CommandsRepository';
import { CommandsService } from './services/commands/CommandsService';

// Instâncias únicas para todo o app
export const devicesRepository = new DevicesRepository();
export const commandsRepository = new CommandsRepository();
export const commandsService = new CommandsService(commandsRepository);
export const devicesService = new DevicesService(devicesRepository, commandsService);
