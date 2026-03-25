import { createClient } from "./client";

const BUCKETS = {
  avatars: "avatars",
  tips: "tips",
  projects: "projects",
} as const;

type BucketName = keyof typeof BUCKETS;

export async function uploadImage(
  bucket: BucketName,
  userId: string,
  file: File,
): Promise<string> {
  const supabase = createClient();
  const timestamp = Date.now();
  const ext = file.name.split(".").pop();
  const path = `${userId}/${timestamp}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKETS[bucket])
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from(BUCKETS[bucket])
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function deleteImage(
  bucket: BucketName,
  path: string,
): Promise<void> {
  const supabase = createClient();

  const urlPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKETS[bucket]}/`;
  const filePath = path.startsWith("http")
    ? path.replace(urlPrefix, "")
    : path;

  const { error } = await supabase.storage
    .from(BUCKETS[bucket])
    .remove([filePath]);

  if (error) throw error;
}
