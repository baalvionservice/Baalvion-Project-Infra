"use client"

import { useRef, useState } from "react"
import { Upload, Star, Trash2, ImageOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  uploadProductMedia,
  deleteProductMedia,
  setFeaturedMedia,
  type CommerceProductMedia,
} from "@/lib/api/commerce-admin"

interface PhotoUploadFieldProps {
  storeId: string;
  productId: string;
  media: CommerceProductMedia[];
  onChange: (media: CommerceProductMedia[]) => void;
}

/**
 * Real file upload for product listing photos — replaces the decorative dashed-border
 * placeholders that used to sit in seller/onboarding/page.tsx (no <input type="file">, no
 * handler, nothing actually uploaded). Every file goes straight to commerce-service's multipart
 * upload endpoint (malware-scanned + encrypted at rest server-side — see
 * commerce-service/lib/encryption.js), through the commerce-proxy's multipart pass-through.
 */
export function PhotoUploadField({ storeId, productId, media, onChange }: PhotoUploadFieldProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const upload = async (files: FileList | File[]) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast({ variant: "destructive", title: `${file.name} isn't an image`, description: "Only image files are accepted here." });
          continue;
        }
        const uploaded = await uploadProductMedia(storeId, productId, file);
        onChange([...media, uploaded]);
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Upload failed", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
  };

  const handleDelete = async (mediaId: string) => {
    setBusyId(mediaId);
    try {
      await deleteProductMedia(storeId, productId, mediaId);
      onChange(media.filter((m) => m.id !== mediaId));
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't delete photo", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setBusyId(null);
    }
  };

  const handleFeature = async (mediaId: string) => {
    setBusyId(mediaId);
    try {
      await setFeaturedMedia(storeId, productId, mediaId);
      onChange(media.map((m) => ({ ...m, isFeatured: m.id === mediaId })));
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't set featured photo", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          dragOver ? "border-cyan-500 bg-cyan-500/5" : "border-white/10 hover:border-white/20"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files?.length) upload(e.target.files); e.target.value = ""; }}
        />
        <Upload className="w-6 h-6 text-gray-500 mx-auto mb-3" />
        <p className="text-sm text-gray-400 font-medium">
          {uploading ? "Uploading…" : "Drag photos here, or click to browse"}
        </p>
        <p className="text-xs text-gray-600 mt-1">JPEG, PNG, WebP, AVIF, GIF — encrypted at rest</p>
      </div>

      {media.length === 0 ? (
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <ImageOff className="w-4 h-4" /> No photos yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {media.map((m) => (
            <div key={m.id} className="relative group rounded-xl overflow-hidden border border-white/10 bg-white/[0.02] aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.thumbnailUrl ?? m.url} alt={m.altText ?? ""} className="w-full h-full object-cover" />
              {m.isFeatured && (
                <div className="absolute top-2 left-2 bg-cyan-500 text-black text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                  Featured
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!m.isFeatured && (
                  <button
                    disabled={busyId === m.id}
                    onClick={() => handleFeature(m.id)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-40"
                    title="Set as featured"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
                <button
                  disabled={busyId === m.id}
                  onClick={() => handleDelete(m.id)}
                  className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 disabled:opacity-40"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
