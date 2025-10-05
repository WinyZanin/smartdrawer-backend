/**
 * Device Types and Interfaces
 *
 * This file contains all type definitions related to devices,
 * including DTOs for API requests and responses.
 */

/**
 * Device entity interface
 * Represents a device in the system
 */
export interface Device {
  /** Unique identifier for the device */
  id: string;
  /** Human-readable name of the device */
  name: string;
  /** Physical location of the device */
  location: string | null;
  /** Current status of the device */
  status: string;
  /** Timestamp when the device was created */
  createdAt: Date;
  /** Timestamp when the device was last updated */
  updatedAt: Date;
  /** Secret key for the device */
  secret: string;
}

/**
 * Device status enumeration
 */
export type DeviceStatus = 'INACTIVE' | 'ACTIVE' | 'ERROR';

/**
 * Data Transfer Object for creating a new device
 */
export interface CreateDeviceDto {
  /** Name of the device */
  name: string;
  /** Optional location of the device */
  location?: string | null;
  /** Optional initial status (defaults to INACTIVE) */
  status?: string;
  /** Secret key for device authentication */
  secret: string;
}

/**
 * Data Transfer Object for updating an existing device
 */
export interface UpdateDeviceDto {
  /** Optional updated name */
  name?: string;
  /** Optional updated location */
  location?: string | null;
  /** Optional updated status */
  status?: string;
  /** Optional updated secret */
  secret?: string;
}

export interface CommandDto {
  action: string;
  drawer: number;
}
