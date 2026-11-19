import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ImageUpload, validateImageFile } from "@/components/form/ImageUpload";
import { MAX_IMAGE_BYTES } from "@/features/uploads/api/uploadsApi";
import type { UploadedImage } from "@/features/uploads/types/upload";

const { mutateMock } = vi.hoisted(() => ({ mutateMock: vi.fn() }));

vi.mock("@/features/uploads/hooks/useUploadImage", () => ({
  useUploadImage: () => ({ mutate: mutateMock, isPending: false }),
}));

/** Selects a file the way the browser does (accept= would filter in userEvent). */
function selectFile(input: HTMLElement, file: File) {
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  fireEvent.change(input);
}

function imageFile(name = "banner.png", type = "image/png", size = 64): File {
  return new File([new Uint8Array(size)], name, { type });
}

beforeEach(() => {
  mutateMock.mockReset();
});

describe("validateImageFile", () => {
  it("accepts jpg, png and webp up to 2 MB", () => {
    expect(validateImageFile(imageFile("a.jpg", "image/jpeg"))).toBeNull();
    expect(validateImageFile(imageFile("a.webp", "image/webp"))).toBeNull();
    expect(validateImageFile(imageFile("a.png", "image/png", MAX_IMAGE_BYTES))).toBeNull();
  });

  it("rejects oversized files and unsupported types", () => {
    expect(validateImageFile(imageFile("big.png", "image/png", MAX_IMAGE_BYTES + 1))).toBe(
      "รูปต้องมีขนาดไม่เกิน 2 MB",
    );
    expect(validateImageFile(imageFile("notes.txt", "text/plain"))).toBe(
      "รองรับเฉพาะไฟล์ jpg, png และ webp",
    );
  });
});

describe("ImageUpload", () => {
  it("previews the chosen file, uploads it and returns the server URL", () => {
    const onChange = vi.fn();
    const onUploaded = vi.fn();
    render(<ImageUpload label="รูปโปรโมชั่น" onChange={onChange} onUploaded={onUploaded} />);

    const input = screen.getByLabelText("รูปโปรโมชั่น");
    const file = imageFile();
    selectFile(input, file);

    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(mutateMock.mock.calls[0][0]).toBe(file);
    const callbacks = mutateMock.mock.calls[0][1] as {
      onSuccess: (image: UploadedImage) => void;
      onError: (error: Error) => void;
    };

    expect(screen.getByRole("img", { name: "รูปโปรโมชั่น" })).toHaveAttribute("src", "blob:vitest");

    const uploaded = { id: "4f6c9d3a-0000-4000-8000-000000000000", url: "/api/v1/files/4f6c9d3a-0000-4000-8000-000000000000" };
    act(() => callbacks.onSuccess(uploaded));

    expect(onChange).toHaveBeenCalledWith(uploaded.url);
    expect(onUploaded).toHaveBeenCalledWith(uploaded);
  });

  it("rejects an oversized file before calling the API", () => {
    render(<ImageUpload label="รูปโปรโมชั่น" onChange={() => {}} />);

    selectFile(screen.getByLabelText("รูปโปรโมชั่น"), imageFile("big.png", "image/png", MAX_IMAGE_BYTES + 1));

    expect(screen.getByRole("alert")).toHaveTextContent("รูปต้องมีขนาดไม่เกิน 2 MB");
    expect(mutateMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("rejects a non-image file before calling the API", () => {
    render(<ImageUpload label="รูปโปรโมชั่น" onChange={() => {}} />);

    selectFile(screen.getByLabelText("รูปโปรโมชั่น"), imageFile("notes.txt", "text/plain"));

    expect(screen.getByRole("alert")).toHaveTextContent("รองรับเฉพาะไฟล์ jpg, png และ webp");
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("shows the API error and keeps the preview so the staff can retry", () => {
    const onChange = vi.fn();
    render(<ImageUpload label="รูปโปรโมชั่น" onChange={onChange} />);

    selectFile(screen.getByLabelText("รูปโปรโมชั่น"), imageFile());
    const callbacks = mutateMock.mock.calls[0][1] as { onError: (error: Error) => void };

    act(() => callbacks.onError(new Error("Image must be 2 MB or smaller")));

    expect(screen.getByRole("alert")).toHaveTextContent("Image must be 2 MB or smaller");
    expect(screen.getByRole("img", { name: "รูปโปรโมชั่น" })).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders an existing image and clears it on remove", () => {
    const onChange = vi.fn();
    function Harness() {
      const [value, setValue] = useState("/api/v1/files/existing");
      return (
        <ImageUpload
          label="รูปโปรโมชั่น"
          value={value}
          onChange={(url) => {
            setValue(url);
            onChange(url);
          }}
        />
      );
    }
    render(<Harness />);

    expect(screen.getByRole("img", { name: "รูปโปรโมชั่น" })).toHaveAttribute(
      "src",
      "/api/v1/files/existing",
    );

    fireEvent.click(screen.getByRole("button", { name: /ลบรูป/ }));
    expect(onChange).toHaveBeenCalledWith("");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
