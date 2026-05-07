ALTER TABLE "users" ADD COLUMN "name" text;
ALTER TABLE "users" ADD COLUMN "email_verified" timestamp;
ALTER TABLE "users" ADD COLUMN "image" text;
ALTER TABLE "users" ADD COLUMN "password_hash" text;
ALTER TABLE "users" ALTER COLUMN "clerk_id" DROP NOT NULL;
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");

CREATE TABLE "accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "provider" text NOT NULL,
  "provider_account_id" text NOT NULL,
  "refresh_token" text,
  "access_token" text,
  "expires_at" integer,
  "token_type" text,
  "scope" text,
  "id_token" text,
  "session_state" text
);

CREATE TABLE "sessions" (
  "session_token" text PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "expires" timestamp NOT NULL
);

CREATE TABLE "verification_tokens" (
  "identifier" text NOT NULL,
  "token" text UNIQUE NOT NULL,
  "expires" timestamp NOT NULL
);
