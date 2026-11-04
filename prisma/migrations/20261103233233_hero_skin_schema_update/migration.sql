/*
  Warnings:

  - You are about to drop the column `lane` on the `Hero` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `Hero` table. All the data in the column will be lost.
  - Added the required column `primaryLane` to the `Hero` table without a default value. This is not possible if the table is not empty.
  - Added the required column `primaryRole` to the `Hero` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Hero" DROP COLUMN "lane",
DROP COLUMN "role",
ADD COLUMN     "note" TEXT,
ADD COLUMN     "primaryLane" "Lane" NOT NULL,
ADD COLUMN     "primaryRole" "Role" NOT NULL,
ADD COLUMN     "releaseDate" TEXT,
ADD COLUMN     "secondaryLane" "Lane",
ADD COLUMN     "secondaryRole" "Role";

-- AlterTable
ALTER TABLE "Skin" ADD COLUMN     "acquisition" TEXT,
ADD COLUMN     "releaseDate" TEXT,
ADD COLUMN     "releaseYear" INTEGER,
ADD COLUMN     "series" TEXT;
