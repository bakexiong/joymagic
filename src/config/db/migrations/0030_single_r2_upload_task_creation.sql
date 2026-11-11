ALTER TABLE "r2_upload_task" ADD COLUMN IF NOT EXISTS "source_url" text;
ALTER TABLE "r2_upload_task" ADD COLUMN IF NOT EXISTS "workbench_creation_id" text;
ALTER TABLE "r2_upload_task" ADD COLUMN IF NOT EXISTS "result_url" text;

UPDATE "r2_upload_task"
SET "source_url" = ("source_urls"::jsonb ->> 0)
WHERE "source_url" IS NULL
  AND "source_urls" IS NOT NULL
  AND jsonb_typeof("source_urls"::jsonb) = 'array';

UPDATE "r2_upload_task"
SET "workbench_creation_id" = ("workbench_creation_ids"::jsonb ->> 0)
WHERE "workbench_creation_id" IS NULL
  AND "workbench_creation_ids" IS NOT NULL
  AND jsonb_typeof("workbench_creation_ids"::jsonb) = 'array';

UPDATE "r2_upload_task"
SET "result_url" = ("result_urls"::jsonb ->> 0)
WHERE "result_url" IS NULL
  AND "result_urls" IS NOT NULL
  AND jsonb_typeof("result_urls"::jsonb) = 'array';

DROP INDEX IF EXISTS "uq_r2_upload_task_ai_task";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'r2_upload_task_workbench_creation_id_workbench_creation_id_fk'
  ) THEN
    ALTER TABLE "r2_upload_task"
      ADD CONSTRAINT "r2_upload_task_workbench_creation_id_workbench_creation_id_fk"
      FOREIGN KEY ("workbench_creation_id")
      REFERENCES "workbench_creation"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_r2_upload_task_workbench_creation"
  ON "r2_upload_task" USING btree ("workbench_creation_id");

CREATE UNIQUE INDEX IF NOT EXISTS "uq_r2_upload_task_ai_source"
  ON "r2_upload_task" USING btree ("ai_task_id", "source_url");
