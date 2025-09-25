-- CreateTable
CREATE TABLE "HomePage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "layout" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HomePage_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HomePagePermission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "homePageId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HomePagePermission_homePageId_fkey" FOREIGN KEY ("homePageId") REFERENCES "HomePage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HomePagePermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "HomePage_accountId_name_key" ON "HomePage"("accountId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "HomePagePermission_homePageId_userId_key" ON "HomePagePermission"("homePageId", "userId");
