/*
  Warnings:

  - Added the required column `field_type_id` to the `field_configs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "content_type_field_type" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content_type_id" INTEGER NOT NULL,
    "field_type_id" INTEGER NOT NULL,
    CONSTRAINT "content_type_field_type_content_type_id_fkey" FOREIGN KEY ("content_type_id") REFERENCES "content_type" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "content_type_field_type_field_type_id_fkey" FOREIGN KEY ("field_type_id") REFERENCES "field_type" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "field_type" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "storage_type" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_field_configs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content_type_id" INTEGER NOT NULL,
    "field_type_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "storage_type" TEXT NOT NULL,
    "validation" TEXT,
    "filters" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "field_configs_content_type_id_fkey" FOREIGN KEY ("content_type_id") REFERENCES "content_type" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "field_configs_field_type_id_fkey" FOREIGN KEY ("field_type_id") REFERENCES "field_type" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_field_configs" ("content_type_id", "created_at", "filters", "id", "label", "name", "storage_type", "updated_at", "validation") SELECT "content_type_id", "created_at", "filters", "id", "label", "name", "storage_type", "updated_at", "validation" FROM "field_configs";
DROP TABLE "field_configs";
ALTER TABLE "new_field_configs" RENAME TO "field_configs";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "field_type_name_key" ON "field_type"("name");
