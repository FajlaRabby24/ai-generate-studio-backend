-- CreateIndex
CREATE INDEX "ai_chat_generatedId_idx" ON "ai_chat"("generatedId");

-- CreateIndex
CREATE INDEX "background_remove_generatedId_idx" ON "background_remove"("generatedId");

-- CreateIndex
CREATE INDEX "generated_userId_isDeleted_idx" ON "generated"("userId", "isDeleted");

-- CreateIndex
CREATE INDEX "generated_type_idx" ON "generated"("type");

-- CreateIndex
CREATE INDEX "image_to_video_generatedId_idx" ON "image_to_video"("generatedId");

-- CreateIndex
CREATE INDEX "image_to_video_requestId_idx" ON "image_to_video"("requestId");

-- CreateIndex
CREATE INDEX "payments_userId_idx" ON "payments"("userId");

-- CreateIndex
CREATE INDEX "payments_subscriptionId_idx" ON "payments"("subscriptionId");

-- CreateIndex
CREATE INDEX "resume_analyzers_generatedId_idx" ON "resume_analyzers"("generatedId");

-- CreateIndex
CREATE INDEX "text_to_image_generatedId_idx" ON "text_to_image"("generatedId");

-- CreateIndex
CREATE INDEX "text_to_video_generatedId_idx" ON "text_to_video"("generatedId");

-- CreateIndex
CREATE INDEX "text_to_video_requestId_idx" ON "text_to_video"("requestId");
