ALTER TABLE "users" ADD COLUMN "alert_threshold" integer DEFAULT 50;
ALTER TABLE "users" ADD COLUMN "alert_enabled" boolean DEFAULT true;
ALTER TABLE "users" ADD COLUMN "last_alert_sent_at" timestamp;

ALTER TABLE "virtual_keys" ADD COLUMN "is_active" boolean DEFAULT true;
