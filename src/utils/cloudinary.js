// src/utils/cloudinary.js
// Frontend never talks to Cloudinary directly and never sees an API secret.
// It converts the file to base64 and posts it to our own /api routes,
// which sign and forward the request to Cloudinary server-side.

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // "data:image/png;base64,...."
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });
}

export async function uploadBlogImage(file, folderSlug) {
  if (!file) throw new Error('No file provided.');
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image must be under 5MB.');
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image.');
  }

  const base64 = await fileToBase64(file);

  const res = await fetch('/api/upload-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: base64,
      folder: `blog-images/${folderSlug || 'unfiled'}`,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Image upload failed.');
  }

  return { url: data.url, publicId: data.publicId };
}

export async function deleteBlogImage(publicId) {
  if (!publicId) return;
  try {
    await fetch('/api/delete-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId }),
    });
  } catch (err) {
    // Non-fatal — image may already be gone, don't block the UI on this.
    console.warn('Failed to delete Cloudinary image:', err.message);
  }
}
