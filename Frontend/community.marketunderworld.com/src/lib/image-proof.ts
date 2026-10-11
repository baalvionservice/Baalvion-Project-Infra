import type { ProofUpload } from "@/lib/api/seller-access"

export type ProofWithPreview = ProofUpload & { preview: string }

// Phone screenshots are large; shrink to a readable JPEG before sending so uploads stay small and fast.
export async function fileToProof(file: File, maxSide = 1600): Promise<ProofWithPreview> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const dataUrl = canvas.toDataURL("image/jpeg", 0.88)
  return { mime: "image/jpeg", data: dataUrl.split(",")[1], preview: dataUrl }
}
