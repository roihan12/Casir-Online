-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "created_by" VARCHAR(36),
ADD COLUMN     "created_by_user_id" VARCHAR(36),
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" VARCHAR(36),
ADD COLUMN     "deleted_by_user_id" VARCHAR(36),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'aktif',
ADD COLUMN     "updated_by" VARCHAR(36),
ADD COLUMN     "updated_by_user_id" VARCHAR(36);

-- CreateTable
CREATE TABLE "menu" (
    "menu_id" TEXT NOT NULL,
    "menu_name" VARCHAR(100) NOT NULL,
    "path" VARCHAR(255),
    "icon" VARCHAR(100),
    "parent_id" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "menu_pkey" PRIMARY KEY ("menu_id")
);

-- CreateTable
CREATE TABLE "role_menu" (
    "role_menu_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "menu_id" TEXT NOT NULL,
    "can_view" BOOLEAN NOT NULL DEFAULT true,
    "can_create" BOOLEAN NOT NULL DEFAULT false,
    "can_edit" BOOLEAN NOT NULL DEFAULT false,
    "can_delete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "role_menu_pkey" PRIMARY KEY ("role_menu_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "role_menu_role_id_menu_id_key" ON "role_menu"("role_id", "menu_id");

-- AddForeignKey
ALTER TABLE "menu" ADD CONSTRAINT "menu_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "menu"("menu_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_menu" ADD CONSTRAINT "role_menu_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_menu" ADD CONSTRAINT "role_menu_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menu"("menu_id") ON DELETE RESTRICT ON UPDATE CASCADE;
