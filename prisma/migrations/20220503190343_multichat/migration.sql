-- CreateTable
CREATE TABLE "setting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "show_changelog" BOOLEAN NOT NULL DEFAULT true,
    "last_version" TEXT NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "delay" INTEGER NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_rss" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "link" TEXT NOT NULL,
    "last" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chat_id" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_rss" ("id", "last", "link", "name") SELECT "id", "last", "link", "name" FROM "rss";
DROP TABLE "rss";
ALTER TABLE "new_rss" RENAME TO "rss";
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_rss_1" ON "rss"("id");
Pragma writable_schema=0;
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "setting_id_key" ON "setting"("id");

-- CreateIndex
CREATE UNIQUE INDEX "setting_chat_id_key" ON "setting"("chat_id");
