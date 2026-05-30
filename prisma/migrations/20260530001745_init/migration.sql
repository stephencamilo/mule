/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "User";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "field_value_text" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content_data_id" INTEGER NOT NULL,
    "field_config_id" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "field_value_text_content_data_id_fkey" FOREIGN KEY ("content_data_id") REFERENCES "content_data" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "field_value_text_field_config_id_fkey" FOREIGN KEY ("field_config_id") REFERENCES "field_configs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "field_value_integer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content_data_id" INTEGER NOT NULL,
    "field_config_id" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,
    CONSTRAINT "field_value_integer_content_data_id_fkey" FOREIGN KEY ("content_data_id") REFERENCES "content_data" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "field_value_integer_field_config_id_fkey" FOREIGN KEY ("field_config_id") REFERENCES "field_configs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "field_value_real" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content_data_id" INTEGER NOT NULL,
    "field_config_id" INTEGER NOT NULL,
    "value" REAL NOT NULL,
    CONSTRAINT "field_value_real_content_data_id_fkey" FOREIGN KEY ("content_data_id") REFERENCES "content_data" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "field_value_real_field_config_id_fkey" FOREIGN KEY ("field_config_id") REFERENCES "field_configs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "field_value_blob" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content_data_id" INTEGER NOT NULL,
    "field_config_id" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "field_value_blob_content_data_id_fkey" FOREIGN KEY ("content_data_id") REFERENCES "content_data" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "field_value_blob_field_config_id_fkey" FOREIGN KEY ("field_config_id") REFERENCES "field_configs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "content_reference" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content_data_id" INTEGER NOT NULL,
    "field_config_id" INTEGER NOT NULL,
    "referenced_content_id" INTEGER NOT NULL,
    CONSTRAINT "content_reference_content_data_id_fkey" FOREIGN KEY ("content_data_id") REFERENCES "content_data" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "content_reference_field_config_id_fkey" FOREIGN KEY ("field_config_id") REFERENCES "field_configs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "content_reference_referenced_content_id_fkey" FOREIGN KEY ("referenced_content_id") REFERENCES "content_data" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "field_configs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content_type_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "storage_type" TEXT NOT NULL,
    "validation" TEXT,
    "filters" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "field_configs_content_type_id_fkey" FOREIGN KEY ("content_type_id") REFERENCES "content_type" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "content_data" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content_type_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "content_data_content_type_id_fkey" FOREIGN KEY ("content_type_id") REFERENCES "content_type" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "content_type" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "content_type_name_key" ON "content_type"("name");
