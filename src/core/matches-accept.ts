// Some containers arrive with an empty File.type (notably .mkv/.avi/.mov on
// certain platforms); fall back to the extension so accept="video/*" still matches.
const extensionToMimeFallback: Record<string, string> = {
  ".mkv": "video/x-matroska",
  ".avi": "video/x-msvideo",
  ".mov": "video/quicktime",
};

export function matchesAccept(file: File, accept: string): boolean {
  const tokens = accept
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return true;

  const fileName = file.name.toLowerCase();
  const fileExt = fileName.substring(fileName.lastIndexOf("."));
  const fileType = file.type.toLowerCase() || extensionToMimeFallback[fileExt] || "";

  return tokens.some((t) => {
    if (t.startsWith(".")) return fileName.endsWith(t);
    if (t.endsWith("/*")) return fileType.startsWith(t.slice(0, -1));
    return fileType === t;
  });
}
