-- CreateTable
CREATE TABLE "statistic" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chat_id" INTEGER NOT NULL,
    "count" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "statistic_id_key" ON "statistic"("id");
