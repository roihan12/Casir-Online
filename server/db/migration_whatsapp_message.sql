-- Migration: Add whatsapp_message table
-- Created: 2025-02-10
-- Description: Store all WhatsApp communications with webhook integration

-- Create whatsapp_message table
CREATE TABLE IF NOT EXISTS "whatsapp_message" (
    "id" SERIAL PRIMARY KEY,
    "message_id" VARCHAR(255) UNIQUE NOT NULL,
    "chat_id" VARCHAR(255) NOT NULL,
    "device_id" VARCHAR(255) NOT NULL,
    "from_phone" VARCHAR(20) NOT NULL,
    "from_name" VARCHAR(100),
    "message_type" VARCHAR(50) NOT NULL, -- text, image, video, audio, document, sticker, location, contact
    "body" TEXT,
    "media_url" VARCHAR(500),
    "timestamp" TIMESTAMP NOT NULL,
    "status" VARCHAR(20) DEFAULT 'sent', -- sent, delivered, read
    "read_at" TIMESTAMP,
    "edited_at" TIMESTAMP,
    "deleted_at" TIMESTAMP,
    "customer_id" VARCHAR(36),
    "branch_id" VARCHAR(36),
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_whatsapp_message_chat" ON "whatsapp_message"("chat_id");
CREATE INDEX IF NOT EXISTS "idx_whatsapp_message_device" ON "whatsapp_message"("device_id");
CREATE INDEX IF NOT EXISTS "idx_whatsapp_message_from" ON "whatsapp_message"("from_phone");
CREATE INDEX IF NOT EXISTS "idx_whatsapp_message_customer" ON "whatsapp_message"("customer_id");
CREATE INDEX IF NOT EXISTS "idx_whatsapp_message_branch" ON "whatsapp_message"("branch_id");
CREATE INDEX IF NOT EXISTS "idx_whatsapp_message_timestamp" ON "whatsapp_message"("timestamp");

-- Add comments for documentation
COMMENT ON TABLE "whatsapp_message" IS 'Stores all WhatsApp communications with webhook integration from go-whatsapp-web-multidevice';
COMMENT ON COLUMN "whatsapp_message"."message_id" IS 'Unique WhatsApp message ID for idempotent processing';
COMMENT ON COLUMN "whatsapp_message"."chat_id" IS 'WhatsApp chat JID (e.g., 628123456789@s.whatsapp.net)';
COMMENT ON COLUMN "whatsapp_message"."device_id" IS 'WhatsApp device JID that received/sent this message';
COMMENT ON COLUMN "whatsapp_message"."from_phone" IS 'Sender phone number (without @s.whatsapp.net)';
COMMENT ON COLUMN "whatsapp_message"."from_name" IS 'Sender display name (pushname)';
COMMENT ON COLUMN "whatsapp_message"."message_type" IS 'Type: text, image, video, audio, document, sticker, location, contact';
COMMENT ON COLUMN "whatsapp_message"."status" IS 'Message status: sent, delivered, read';
COMMENT ON COLUMN "whatsapp_message"."read_at" IS 'When message was read by recipient';
COMMENT ON COLUMN "whatsapp_message"."edited_at" IS 'When message was edited';
COMMENT ON COLUMN "whatsapp_message"."deleted_at" IS 'When message was revoked/deleted';
