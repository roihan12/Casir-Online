const Joi = require("joi");

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const uuidSchema = Joi.string().uuid({ version: "uuidv4" });

const hariValid = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

// ─────────────────────────────────────────────
// REGU CRUD
// ─────────────────────────────────────────────

const createReguSchema = Joi.object({
  namaRegu: Joi.string().min(2).max(100).required().messages({
    "string.empty": "namaRegu tidak boleh kosong",
    "string.min": "namaRegu minimal 2 karakter",
    "string.max": "namaRegu maksimal 100 karakter",
    "any.required": "namaRegu wajib diisi",
  }),
  cabangId: Joi.string().required().messages({
    "string.guid": "cabangId harus berformat UUID v4",
    "any.required": "cabangId wajib diisi",
  }),
  keterangan: Joi.string().max(255).optional().allow("", null),
});

const updateReguSchema = Joi.object({
  namaRegu: Joi.string().min(2).max(100).optional().messages({
    "string.min": "namaRegu minimal 2 karakter",
    "string.max": "namaRegu maksimal 100 karakter",
  }),
  keterangan: Joi.string().max(255).optional().allow("", null),
}).min(1).messages({
  "object.min": "Minimal satu field harus diisi untuk update",
});

const getReguSchema = Joi.object({
  cabangId: Joi.string().optional(),
  search: Joi.string().max(100).optional().allow(""),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

// ─────────────────────────────────────────────
// REGU MEMBER CRUD
// ─────────────────────────────────────────────

const addReguMemberSchema = Joi.object({
  userIds: Joi.array()
    .items(Joi.string().required())
    .min(1)
    .unique()
    .required()
    .messages({
      "array.min": "Minimal 1 userId harus diisi",
      "array.unique": "userIds tidak boleh duplikat",
      "any.required": "userIds wajib diisi",
    }),
});

const removeReguMemberSchema = Joi.object({
  userIds: Joi.array()
    .items(Joi.string().required())
    .min(1)
    .unique()
    .required()
    .messages({
      "array.min": "Minimal 1 userId harus diisi",
      "array.unique": "userIds tidak boleh duplikat",
      "any.required": "userIds wajib diisi",
    }),
});

const getReguMemberSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

// ─────────────────────────────────────────────
// JADWAL REGU ROLLING
// ─────────────────────────────────────────────

// Schema untuk satu item pola regu
const reguJadwalItemSchema = Joi.object({
  reguId: uuidSchema.required().messages({
    "string.guid": "reguId harus berformat UUID v4",
    "any.required": "reguId wajib diisi",
  }),

  tanggalMulaiKerjaRegu: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      "string.pattern.base": "tanggalMulaiKerjaRegu harus format YYYY-MM-DD",
      "any.required": "tanggalMulaiKerjaRegu wajib diisi",
    }),

  pola: Joi.array()
    .items(Joi.number().valid(0, 1).required())
    .min(2)
    .max(14)
    .required()
    .custom((value, helpers) => {
      // Harus ada minimal 1 hari kerja (1) dan 1 hari libur (0)
      if (!value.includes(1)) {
        return helpers.error("pola.noWorkDay");
      }
      if (!value.includes(0)) {
        return helpers.error("pola.noOffDay");
      }
      return value;
    })
    .messages({
      "array.min": "pola minimal 2 elemen",
      "array.max": "pola maksimal 14 elemen (2 minggu)",
      "any.required": "pola wajib diisi",
      "any.only": "pola hanya boleh berisi 0 (libur) atau 1 (kerja)",
      "pola.noWorkDay": "pola harus mengandung minimal 1 hari kerja (nilai 1)",
      "pola.noOffDay": "pola harus mengandung minimal 1 hari libur (nilai 0)",
    }),

  rotasiShift: Joi.array()
    .items(uuidSchema.required())
    .min(1)
    .max(5)
    .unique()
    .required()
    .messages({
      "array.min": "rotasiShift minimal 1 shift",
      "array.max": "rotasiShift maksimal 5 shift",
      "array.unique": "rotasiShift tidak boleh duplikat",
      "any.required": "rotasiShift wajib diisi",
    }),

  hariKerjaPerRotasi: Joi.number()
    .integer()
    .min(1)
    .max(30)
    .required()
    .messages({
      "number.min": "hariKerjaPerRotasi minimal 1",
      "number.max": "hariKerjaPerRotasi maksimal 30",
      "any.required": "hariKerjaPerRotasi wajib diisi",
    }),

  startShiftId: uuidSchema.required().messages({
    "string.guid": "startShiftId harus berformat UUID v4",
    "any.required": "startShiftId wajib diisi",
  }),
}).custom((value, helpers) => {
  // startShiftId harus ada di dalam rotasiShift
  if (!value.rotasiShift.includes(value.startShiftId)) {
    return helpers.error("reguItem.startShiftNotInRotasi");
  }

  // hariKerjaPerRotasi tidak boleh melebihi total hari kerja dalam satu siklus pola
  // agar tidak terjadi shift yang tidak pernah dipakai
  const totalHariKerjaPerSiklus = value.pola.filter((p) => p === 1).length;
  if (value.hariKerjaPerRotasi > totalHariKerjaPerSiklus * 10) {
    // warning saja, bukan error — bisa jadi memang siklus panjang
  }

  return value;
}, "regu item cross-field validation").messages({
  "reguItem.startShiftNotInRotasi": "startShiftId harus ada di dalam array rotasiShift",
});

const generateJadwalReguSchema = Joi.object({
  cabangId: Joi.string().required().messages({
    "string.guid": "cabangId harus berformat UUID v4",
    "any.required": "cabangId wajib diisi",
  }),

  tanggalMulai: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      "string.pattern.base": "tanggalMulai harus format YYYY-MM-DD",
      "any.required": "tanggalMulai wajib diisi",
    }),

  tanggalSelesai: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      "string.pattern.base": "tanggalSelesai harus format YYYY-MM-DD",
      "any.required": "tanggalSelesai wajib diisi",
    }),

  skipExisting: Joi.boolean().default(true),

  regu: Joi.array()
    .items(reguJadwalItemSchema)
    .min(1)
    .max(20)
    .unique("reguId")
    .required()
    .messages({
      "array.min": "Minimal 1 regu harus diisi",
      "array.max": "Maksimal 20 regu dalam satu generate",
      "array.unique": "reguId tidak boleh duplikat dalam satu request",
      "any.required": "regu wajib diisi",
    }),
}).custom((value, helpers) => {
  // Validasi tanggalMulai <= tanggalSelesai
  const start = new Date(value.tanggalMulai);
  const end = new Date(value.tanggalSelesai);

  if (start > end) {
    return helpers.error("date.startAfterEnd");
  }

  // Max range 366 hari
  const dayDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  if (dayDiff > 366) {
    return helpers.error("date.rangeTooLarge");
  }

  // Validasi setiap tanggalMulaiKerjaRegu tidak lebih dari 1 tahun sebelum tanggalMulai
  for (const reguItem of value.regu) {
    const reguStart = new Date(reguItem.tanggalMulaiKerjaRegu);
    const diffDays = Math.ceil((start - reguStart) / (1000 * 60 * 60 * 24));
    if (diffDays > 366) {
      return helpers.error("date.reguStartTooEarly", {
        reguId: reguItem.reguId,
      });
    }
  }

  return value;
}, "jadwal regu date validation").messages({
  "date.startAfterEnd": "tanggalMulai tidak boleh lebih besar dari tanggalSelesai",
  "date.rangeTooLarge": "Rentang tanggal tidak boleh lebih dari 366 hari",
  "date.reguStartTooEarly":
    "tanggalMulaiKerjaRegu tidak boleh lebih dari 1 tahun sebelum tanggalMulai generate",
});

const moveReguMemberSchema = Joi.object({
  userIds: Joi.array()
    .items(uuidSchema.required())
    .min(1)
    .unique()
    .required()
    .messages({
      "array.min": "Minimal 1 userId harus diisi",
      "array.unique": "userIds tidak boleh duplikat",
      "any.required": "userIds wajib diisi",
    }),
  fromReguId: uuidSchema.required().messages({
    "string.guid": "fromReguId harus berformat UUID v4",
    "any.required": "fromReguId wajib diisi",
  }),
  toReguId: uuidSchema.required().messages({
    "string.guid": "toReguId harus berformat UUID v4",
    "any.required": "toReguId wajib diisi",
  }),
});

module.exports = {
  // Regu
  createReguSchema,
  updateReguSchema,
  getReguSchema,
  // Member
  addReguMemberSchema,
  removeReguMemberSchema,
  getReguMemberSchema,
  moveReguMemberSchema,
  // Jadwal
  generateJadwalReguSchema,
};
