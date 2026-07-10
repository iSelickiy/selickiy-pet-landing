ALTER TABLE "Project"
ADD COLUMN "stage" TEXT NOT NULL DEFAULT 'В процессе';

CREATE INDEX "Project_status_sortOrder_idx" ON "Project"("status", "sortOrder");
CREATE INDEX "MediaFile_createdAt_idx" ON "MediaFile"("createdAt");
CREATE INDEX "CustomPage_folder_createdAt_idx" ON "CustomPage"("folder", "createdAt");
CREATE INDEX "ResumeExperience_sortOrder_idx" ON "ResumeExperience"("sortOrder");
CREATE INDEX "ContactButton_sortOrder_idx" ON "ContactButton"("sortOrder");
CREATE INDEX "SocialLink_sortOrder_idx" ON "SocialLink"("sortOrder");
