import { BACKOFFICE_API_ROOT } from "./axios";

/**
 * Turns a stored image path (/api/v1/files/<id>, served by backoffice-api)
 * into a URL the browser can load. This web app runs on another origin, so a
 * relative path would be requested from the Next.js server and 404.
 * Absolute (http/https), blob: and data: URLs pass through unchanged.
 */
export function mediaUrl(path: string | null | undefined, root: string = BACKOFFICE_API_ROOT): string {
  if (!path) return "";
  if (/^(https?:|blob:|data:)/i.test(path)) return path;
  return root.replace(/\/$/, "") + "/" + path.replace(/^\/+/, "");
}
