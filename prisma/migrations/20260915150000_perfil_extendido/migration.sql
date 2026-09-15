-- AlterTable
ALTER TABLE "User" ADD COLUMN     "fotoPerfilUrl" TEXT,
ADD COLUMN     "direccionCalle" TEXT,
ADD COLUMN     "direccionColonia" TEXT,
ADD COLUMN     "codigoPostal" TEXT,
ADD COLUMN     "textoPresentacion" TEXT,
ADD COLUMN     "redSocialFacebook" TEXT,
ADD COLUMN     "redSocialInstagram" TEXT,
ADD COLUMN     "redSocialTiktok" TEXT,
ADD COLUMN     "membresiaExpiraEn" TIMESTAMP(3);
