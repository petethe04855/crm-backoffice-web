/** The response of POST /api/v1/crm/uploads/images. */
export interface UploadedImage {
  /** uuid used in the public URL and as the storage key. */
  id: string;
  /** Public path, e.g. /api/v1/files/<id>. */
  url: string;
}
