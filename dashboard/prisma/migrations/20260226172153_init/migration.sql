-- CreateTable
CREATE TABLE "ErrorRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "errorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "stack" TEXT,
    "fingerprint" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assignedTo" TEXT,
    "resolvedAt" DATETIME,
    "ignoredAt" DATETIME,
    "projectId" TEXT,
    CONSTRAINT "ErrorRecord_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ErrorOccurrence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "errorId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "context" TEXT NOT NULL,
    CONSTRAINT "ErrorOccurrence_errorId_fkey" FOREIGN KEY ("errorId") REFERENCES "ErrorRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "errorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Comment_errorId_fkey" FOREIGN KEY ("errorId") REFERENCES "ErrorRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ErrorRecord_errorId_key" ON "ErrorRecord"("errorId");

-- CreateIndex
CREATE INDEX "ErrorRecord_fingerprint_idx" ON "ErrorRecord"("fingerprint");

-- CreateIndex
CREATE INDEX "ErrorRecord_severity_idx" ON "ErrorRecord"("severity");

-- CreateIndex
CREATE INDEX "ErrorRecord_status_idx" ON "ErrorRecord"("status");

-- CreateIndex
CREATE INDEX "ErrorRecord_timestamp_idx" ON "ErrorRecord"("timestamp");

-- CreateIndex
CREATE INDEX "ErrorRecord_projectId_idx" ON "ErrorRecord"("projectId");

-- CreateIndex
CREATE INDEX "ErrorOccurrence_errorId_idx" ON "ErrorOccurrence"("errorId");

-- CreateIndex
CREATE INDEX "ErrorOccurrence_timestamp_idx" ON "ErrorOccurrence"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Project_apiKey_key" ON "Project"("apiKey");

-- CreateIndex
CREATE INDEX "Project_slug_idx" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Comment_errorId_idx" ON "Comment"("errorId");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");
