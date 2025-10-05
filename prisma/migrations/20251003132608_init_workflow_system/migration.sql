-- CreateTable
CREATE TABLE "GenerationRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "mood" TEXT NOT NULL,
    "colors" TEXT NOT NULL,
    "additionalDetails" TEXT NOT NULL,
    "customTags" TEXT,
    "additionalNotes" TEXT,
    "uploadedImageBase64" TEXT NOT NULL DEFAULT '',
    "aspectRatio" TEXT NOT NULL DEFAULT '1:1',
    "negativePrompt" TEXT,
    "brandIdentity" TEXT,
    "currentStep" TEXT NOT NULL DEFAULT 'step1_prompt_generation',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "inputData" TEXT,
    "outputData" TEXT,
    "errorMessage" TEXT,
    "generatedPrompt" TEXT,
    "requestedPhotoCount" INTEGER NOT NULL DEFAULT 3,
    "generatedPhotoCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Workflow_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "GenerationRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GeneratedPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "prompt" TEXT NOT NULL,
    "negativePrompt" TEXT,
    "generationStep" TEXT NOT NULL,
    "aiModel" TEXT NOT NULL,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "userFeedback" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GeneratedPhoto_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "GenerationRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Refinement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "photoId" TEXT NOT NULL,
    "refinementType" TEXT NOT NULL,
    "comfyuiJobId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "inputImageUrl" TEXT NOT NULL,
    "outputImageUrl" TEXT,
    "parameters" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Refinement_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "GeneratedPhoto" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "prompt" TEXT NOT NULL,
    "negativePrompt" TEXT,
    "inputImageUrl" TEXT NOT NULL,
    "outputImageUrl" TEXT,
    "paramsJson" TEXT NOT NULL,
    "errorMessage" TEXT,
    "lensiaJobId" TEXT,
    "webhookUrl" TEXT,
    "webhookSent" BOOLEAN NOT NULL DEFAULT false,
    "webhookSentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "GenerationRequest_userId_idx" ON "GenerationRequest"("userId");

-- CreateIndex
CREATE INDEX "GenerationRequest_currentStep_idx" ON "GenerationRequest"("currentStep");

-- CreateIndex
CREATE INDEX "GenerationRequest_status_idx" ON "GenerationRequest"("status");

-- CreateIndex
CREATE INDEX "GenerationRequest_createdAt_idx" ON "GenerationRequest"("createdAt");

-- CreateIndex
CREATE INDEX "Workflow_requestId_idx" ON "Workflow"("requestId");

-- CreateIndex
CREATE INDEX "Workflow_step_idx" ON "Workflow"("step");

-- CreateIndex
CREATE INDEX "Workflow_status_idx" ON "Workflow"("status");

-- CreateIndex
CREATE INDEX "GeneratedPhoto_requestId_idx" ON "GeneratedPhoto"("requestId");

-- CreateIndex
CREATE INDEX "GeneratedPhoto_generationStep_idx" ON "GeneratedPhoto"("generationStep");

-- CreateIndex
CREATE INDEX "GeneratedPhoto_isSelected_idx" ON "GeneratedPhoto"("isSelected");

-- CreateIndex
CREATE INDEX "Refinement_photoId_idx" ON "Refinement"("photoId");

-- CreateIndex
CREATE INDEX "Refinement_status_idx" ON "Refinement"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Job_lensiaJobId_key" ON "Job"("lensiaJobId");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");

-- CreateIndex
CREATE INDEX "Job_createdAt_idx" ON "Job"("createdAt");

-- CreateIndex
CREATE INDEX "Job_lensiaJobId_idx" ON "Job"("lensiaJobId");
