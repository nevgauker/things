import { cloudinary } from './cloudinary';

export async function uploadImageFromFormData(formData: FormData, key: string, folder?: string) {
  const file = formData.get(key);
  if (!file || typeof file === 'string') return null;
  const arrayBuffer = await (file as File).arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filename = (file as File).name || 'upload.jpg';
  const folderPath = folder || process.env.DEVELOPMENT_THINGS_IMAGES_PATH || '/';

  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: folderPath, resource_type: 'image', use_filename: true, filename_override: filename },
      (err, result) => {
        if (err || !result) return reject(err);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

