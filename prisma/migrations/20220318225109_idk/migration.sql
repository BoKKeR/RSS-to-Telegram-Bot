-- CreateTable
CREATE TABLE "Rss" (
    "last" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "link" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Version" (
    "version" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Rss_name_key" ON "Rss"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Version_version_key" ON "Version"("version");
