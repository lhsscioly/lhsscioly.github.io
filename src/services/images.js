import { createClient } from "@supabase/supabase-js";

// Uses Supabase's buckets to handle image uploads for each test

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_API_KEY,
);

const getImageUrl = async (file) => {
  if (!file) return null;
  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = `images/${fileName}`;

  const { data, error } = await supabase.storage
    .from("images")
    .upload(filePath, file);

  if (error) {
    console.error(error);
    return null;
  }

  const { data: result, error: urlError } = supabase.storage
    .from("images")
    .getPublicUrl(filePath);

  if (urlError) {
    console.error("Public URL error:", urlError);
    return null;
  }

  if (result) {
    return result.publicUrl;
  }
};

export default { getImageUrl };
