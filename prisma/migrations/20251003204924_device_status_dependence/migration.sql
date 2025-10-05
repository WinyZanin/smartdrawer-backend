-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DeviceStatus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "lastPoll" DATETIME NOT NULL,
    "lastCommand" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DeviceStatus_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DeviceStatus" ("createdAt", "deviceId", "id", "lastCommand", "lastPoll", "updatedAt") SELECT "createdAt", "deviceId", "id", "lastCommand", "lastPoll", "updatedAt" FROM "DeviceStatus";
DROP TABLE "DeviceStatus";
ALTER TABLE "new_DeviceStatus" RENAME TO "DeviceStatus";
CREATE UNIQUE INDEX "DeviceStatus_deviceId_key" ON "DeviceStatus"("deviceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
