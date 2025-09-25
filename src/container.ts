import { DevicesRepository } from './repositories/devices/DevicesRepository';
import { DevicesService } from './services/devices/DevicesService';

// Instâncias únicas para todo o app
export const devicesRepository = new DevicesRepository();
export const devicesService = new DevicesService(devicesRepository);
