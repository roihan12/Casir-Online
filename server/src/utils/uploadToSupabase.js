const { ResponseError } = require("../error/responseError");
const path = require("path");
const { supabase,bucketName } = require("../config/supabase");

const uploadFileToSupabase = async (file) => {
  const timestamp = Date.now();
  const fileExt = path.extname(file.originalname);
  const fileName = `${timestamp}-${file.originalname.replace(/\s+/g, "-")}`;
  const filePath = `products/${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
    });

  if (error) {
    throw new ResponseError(400, `Error uploading file: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return {
    url: urlData.publicUrl,
    filename: fileName,
  };
};

const deleteFilesFromSupabase = async (filePaths) => {
  if (!filePaths || filePaths.length === 0) return;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .remove(filePaths);

  if (error) {
    console.error("Error deleting files from Supabase:", error);
    throw new Error(`Error deleting files from Supabase: ${error.message}`);
  }

  return data;
};

module.exports = { uploadFileToSupabase, deleteFilesFromSupabase };
