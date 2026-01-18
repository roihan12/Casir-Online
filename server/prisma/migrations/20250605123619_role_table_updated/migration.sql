-- AlterTable
ALTER TABLE "permissions" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'aktif';

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "display_name" VARCHAR(100) NOT NULL DEFAULT '',
ADD COLUMN     "is_system" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "user_roles" ADD COLUMN     "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "assigned_by" TEXT DEFAULT '';
