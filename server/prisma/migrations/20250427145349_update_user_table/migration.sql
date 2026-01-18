-- AlterTable
ALTER TABLE "user" ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "created_by_user_id" TEXT,
ADD COLUMN     "deleted_by" TEXT,
ADD COLUMN     "deleted_by_user_id" TEXT,
ADD COLUMN     "updated_by" TEXT,
ADD COLUMN     "updated_by_user_id" TEXT;
