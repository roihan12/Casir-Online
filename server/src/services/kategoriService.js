const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const { validate } = require("../validation/validation");
const {
  CreateKategoriValidation,
  UpdateKategoriValidation,
} = require("../validation/kategoriValidation");
const {
  cacheSet,
  cacheGet,
  cacheDelete,
  createCacheKey,
  cacheOrFetch,
} = require("../utils/redisUtils");

const getAllKategori = async () => {
  const cacheKey = createCacheKey("kategori", "all");

  return await cacheOrFetch(
    cacheKey,
    async () => {
      return prisma.kategori.findMany({ where: { deletedAt: null } });
    },
    3600
  ); // Cache selama 1 jam
};

const getKategoriById = async (kategoriId) => {
  const cacheKey = createCacheKey("kategori", kategoriId);

  return await cacheOrFetch(
    cacheKey,
    async () => {
      const kategori = await prisma.kategori.findUnique({
        where: { id: kategoriId, deletedAt: null },
      });

      if (!kategori) {
        throw new ResponseError(404, "Category not found");
      }

      return kategori;
    },
    3600
  ); // Cache selama 1 jam
};

const createKategori = async (kategoriData) => {
  const kategoriValid = validate(CreateKategoriValidation, kategoriData);

  const newKategori = await prisma.kategori.create({
    data: kategoriValid,
  });

  // Simpan kategori baru ke cache
  const cacheKey = createCacheKey("kategori", newKategori.id);
  await cacheSet(cacheKey, newKategori, 3600);

  // Invalidasi cache daftar kategori
  await cacheDelete("kategori:all");

  return newKategori;
};

const updateKategori = async (kategoriId, kategoriData) => {
  const kategoriValid = validate(UpdateKategoriValidation, kategoriData);

  const kategori = await prisma.kategori.findUnique({
    where: { id: kategoriId },
  });

  if (!kategori) {
    throw new ResponseError(404, "Category not found");
  }

  const updatedKategori = await prisma.kategori.update({
    where: { id: kategoriId },
    data: kategoriValid,
  });

  // Update cache kategori
  const cacheKey = createCacheKey("kategori", kategoriId);
  await cacheSet(cacheKey, updatedKategori, 3600);

  // Invalidasi cache daftar kategori
  await cacheDelete("kategori:all");

  return updatedKategori;
};

const deleteKategori = async (kategoriId) => {
  const kategori = await prisma.kategori.findUnique({
    where: { id: kategoriId },
  });

  if (!kategori) {
    throw new ResponseError(404, "Category not found");
  }

  const deletedKategori = await prisma.kategori.update({
    where: { id: kategoriId },
    data: {
      status: "nonaktif",
      deletedAt: new Date(),
    },
  });

  // Hapus cache kategori
  const cacheKey = createCacheKey("kategori", kategoriId);
  await cacheDelete(cacheKey);

  // Invalidasi cache daftar kategori
  await cacheDelete("kategori:all");

  return deletedKategori;
};

module.exports = {
  getAllKategori,
  getKategoriById,
  createKategori,
  updateKategori,
  deleteKategori,
};
