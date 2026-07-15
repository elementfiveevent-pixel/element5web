"use client";

import React, { useState, useRef } from "react";
import { api } from "@/lib/api";
import { Upload, X, CheckCircle, AlertCircle, Image as ImageIcon } from "lucide-react";

interface CloudinarySignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  uploadPreset?: string;
}

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
}

interface Props {
  folder?: string;
  accept?: string;
  label?: string;
  onUploadSuccess?: (result: CloudinaryUploadResult) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  maxSizeMB?: number;
}

export default function CloudinaryUpload({
  folder = "element5/uploads",
  accept = "image/*,video/*",
  label = "UPLOAD FILE",
  onUploadSuccess,
  onUploadError,
  className = "",
  maxSizeMB = 50,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const handleFile = async (file: File) => {
    if (!file) return;

    // Validate size
    if (file.size > maxSizeBytes) {
      const msg = `File too large. Max size is ${maxSizeMB}MB.`;
      setError(msg);
      onUploadError?.(msg);
      return;
    }

    // Generate local preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Step 1: Get signed upload signature from backend
      const sig: CloudinarySignature = await api.get("/media/signature", {
        params: { folder },
      });

      // Step 2: Upload directly to Cloudinary using the signed params
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sig.apiKey);
      formData.append("timestamp", sig.timestamp.toString());
      formData.append("signature", sig.signature);
      formData.append("folder", sig.folder || folder);
      if (sig.uploadPreset) formData.append("upload_preset", sig.uploadPreset);

      // Use XMLHttpRequest to track upload progress
      const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const uploadUrl = `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`;

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            try {
              const errBody = JSON.parse(xhr.responseText);
              reject(new Error(errBody.error?.message || "Upload failed"));
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.open("POST", uploadUrl);
        xhr.send(formData);
      });

      setUploadedUrl(result.secure_url);
      setProgress(100);
      onUploadSuccess?.(result);
    } catch (err: any) {
      const msg = err?.message || "Upload failed. Please try again.";
      setError(msg);
      setPreview(null);
      onUploadError?.(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setUploadedUrl(null);
    setPreview(null);
    setError(null);
    setProgress(0);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Drop zone */}
      {!uploadedUrl && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileRef.current?.click()}
          className={`relative border-3 border-dashed rounded p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
            dragging
              ? "border-yellow-festival bg-yellow-festival/10"
              : uploading
              ? "border-gray-300 bg-gray-50 cursor-not-allowed"
              : "border-[#121212] bg-white hover:bg-gray-50"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="hidden"
            disabled={uploading}
          />

          {preview ? (
            <img src={preview} alt="Preview" className="w-24 h-24 object-cover rounded border-2 border-[#121212]" />
          ) : (
            <div className="w-12 h-12 bg-gray-100 border-2 border-[#121212] rounded flex items-center justify-center">
              <ImageIcon size={24} className="text-gray-400" />
            </div>
          )}

          <div className="text-center">
            <p className="font-display font-black text-sm uppercase tracking-wider">
              {uploading ? "UPLOADING..." : dragging ? "DROP FILE HERE" : label}
            </p>
            <p className="font-space text-xs text-gray-400 mt-1">
              Drag & drop or click to browse · Max {maxSizeMB}MB
            </p>
          </div>

          {/* Progress bar */}
          {uploading && (
            <div className="w-full max-w-xs space-y-1">
              <div className="w-full h-2 bg-gray-200 rounded-full border border-[#121212] overflow-hidden">
                <div
                  className="h-full bg-yellow-festival transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-[10px] font-black text-gray-500">{progress}%</p>
            </div>
          )}
        </div>
      )}

      {/* Success state */}
      {uploadedUrl && (
        <div className="border-3 border-green-500 bg-green-50 p-4 rounded space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
            <p className="font-display font-black text-sm uppercase text-green-700">UPLOAD SUCCESSFUL</p>
            <button
              onClick={reset}
              className="ml-auto p-1 hover:bg-green-100 rounded"
              title="Upload another file"
            >
              <X size={14} className="text-green-600" />
            </button>
          </div>

          {/* Thumbnail preview */}
          {uploadedUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || preview ? (
            <img
              src={uploadedUrl}
              alt="Uploaded"
              className="w-full max-h-48 object-cover rounded border-2 border-green-400"
            />
          ) : (
            <a
              href={uploadedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block font-space text-xs text-green-700 underline truncate"
            >
              {uploadedUrl}
            </a>
          )}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-2 border-2 border-red-stage bg-red-50 p-3 rounded">
          <AlertCircle size={14} className="text-red-stage flex-shrink-0 mt-0.5" />
          <p className="font-space text-xs text-red-stage font-bold">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto flex-shrink-0">
            <X size={12} className="text-red-stage" />
          </button>
        </div>
      )}
    </div>
  );
}
