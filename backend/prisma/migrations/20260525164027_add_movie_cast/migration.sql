-- AlterTable
ALTER TABLE "Movie" ADD COLUMN     "cast" TEXT[] DEFAULT ARRAY[]::TEXT[];
