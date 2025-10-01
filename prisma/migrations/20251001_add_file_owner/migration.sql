ALTER TABLE "public"."File"
  ADD COLUMN "ownerUserId" INTEGER;

ALTER TABLE "public"."File"
  ADD CONSTRAINT "File_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


