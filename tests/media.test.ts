import { describe, expect, it } from "vitest";
import { mediaUrl } from "@/lib/media";

describe("mediaUrl", () => {
  it("prefixes stored file paths with the backoffice-api root", () => {
    expect(mediaUrl("/api/v1/files/abc", "http://localhost:8090")).toBe("http://localhost:8090/api/v1/files/abc");
    expect(mediaUrl("api/v1/files/abc", "https://bo.example.com/")).toBe("https://bo.example.com/api/v1/files/abc");
  });
  it("keeps absolute, blob and data URLs", () => {
    expect(mediaUrl("https://cdn.example.com/a.jpg")).toBe("https://cdn.example.com/a.jpg");
    expect(mediaUrl("blob:http://localhost:8092/x")).toBe("blob:http://localhost:8092/x");
    expect(mediaUrl("data:image/png;base64,AA")).toBe("data:image/png;base64,AA");
  });
  it("returns empty for no image", () => {
    expect(mediaUrl("")).toBe("");
    expect(mediaUrl(undefined)).toBe("");
  });
});
