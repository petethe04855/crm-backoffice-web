/** The two states every marketing table shows: public (live in the LINE app) or not. */
export type PublicStatus = "public" | "unpublic";

export const PUBLIC_STATUS_LABEL: Record<PublicStatus, string> = {
  public: "public",
  unpublic: "unpublic",
};

export const PUBLIC_STATUS_VARIANT: Record<PublicStatus, "default" | "subtle"> = {
  public: "default",
  unpublic: "subtle",
};