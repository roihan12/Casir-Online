const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const bucketName = process.env.SUPABASE_BUCKET_NAME;

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = {
  supabase,
  bucketName,
};
