-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_setting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "show_changelog" BOOLEAN NOT NULL DEFAULT true,
    "last_version" TEXT NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "delay" INTEGER NOT NULL,
    "feed_type" TEXT NOT NULL DEFAULT 'links'
);
INSERT INTO "new_setting" ("chat_id", "delay", "id", "last_version", "show_changelog") SELECT "chat_id", "delay", "id", "last_version", "show_changelog" FROM "setting";
DROP TABLE "setting";
ALTER TABLE "new_setting" RENAME TO "setting";
CREATE UNIQUE INDEX "setting_id_key" ON "setting"("id");
CREATE UNIQUE INDEX "setting_chat_id_key" ON "setting"("chat_id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
