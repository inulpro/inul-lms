/**
 * Generate public S3 URL from key
 * @param key - S3 object key
 * @returns Public URL to access the S3 object
 */
export async function getS3PublicUrl(key: string): Promise<string> {
  if (!key) return "";

  try {
    const response = await fetch("/api/s3/url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key }),
    });

    if (!response.ok) {
      console.error("Failed to get S3 URL from API");
      return "";
    }

    const { url } = await response.json();
    return url;
  } catch (error) {
    console.error("Error getting S3 URL:", error);
    return "";
  }
}

/**
 * Generate public S3 URL from key (synchronous fallback)
 * @param key - S3 object key
 * @returns Public URL to access the S3 object
 */
export function getS3PublicUrlSync(key: string): string {
  if (!key) return "";

  // Remove any leading slashes
  const cleanKey = key.startsWith("/") ? key.slice(1) : key;

  // Get bucket name from environment (client-side accessible)
  const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;

  if (!bucketName) {
    console.error("NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES not found");
    return "";
  }

  // For now, assume AWS S3 format. You can customize this based on your setup
  // If you're using a different S3 provider, you'll need to adjust this
  return `https://${bucketName}.s3.amazonaws.com/${cleanKey}`;
}

/**
 * Check if a URL is a valid S3 key (not a full URL)
 * @param value - The value to check
 * @returns true if it's a key, false if it's already a URL
 */
export function isS3Key(value: string): boolean {
  if (!value) return false;
  return (
    !value.startsWith("http://") &&
    !value.startsWith("https://") &&
    !value.startsWith("blob:")
  );
}
