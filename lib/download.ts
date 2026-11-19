/**
 * Saves a Blob to the user's disk through a temporary object URL.
 *
 * Call it only from the browser (event handlers / mutation callbacks). The
 * object URL is revoked right after the click so the file does not stay pinned
 * in memory.
 */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
