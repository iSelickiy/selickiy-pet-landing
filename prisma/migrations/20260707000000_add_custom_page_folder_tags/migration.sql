-- AlterTable
ALTER TABLE "CustomPage" ADD COLUMN "folder" TEXT NOT NULL DEFAULT '',
                    ADD COLUMN "tags"   TEXT NOT NULL DEFAULT '[]';
