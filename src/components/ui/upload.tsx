import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Upload,
  X,
  File,
  FileImage,
  FileText,
  FileVideo,
  FileArchive,
  CheckCircle2,
} from "lucide-react";
import { Button } from "./button";

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  value?: File[];
  onChange?: (files: File[]) => void;
  onDrop?: (files: File[]) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  description?: string;
  error?: string;
  showPreviews?: boolean;
}

function getFileIcon(file: File) {
  const type = file.type;
  if (type.startsWith("image/"))
    return <FileImage className="h-5 w-5 text-blue-500" />;
  if (type.startsWith("video/"))
    return <FileVideo className="h-5 w-5 text-purple-500" />;
  if (type.includes("pdf") || type.includes("document"))
    return <FileText className="h-5 w-5 text-red-500" />;
  if (type.includes("zip") || type.includes("archive"))
    return <FileArchive className="h-5 w-5 text-yellow-500" />;
  return <File className="h-5 w-5 text-gray-500" />;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function FileUpload({
  accept,
  multiple = false,
  maxSize = 10 * 1024 * 1024,
  maxFiles = 5,
  value = [],
  onChange,
  onDrop,
  onError,
  disabled = false,
  className,
  label,
  description,
  error,
  showPreviews = true,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<
    Record<string, number>
  >({});
  const inputRef = React.useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File "${file.name}" exceeds maximum size of ${formatFileSize(maxSize)}`;
    }
    if (accept) {
      const acceptedTypes = accept.split(",").map((t) => t.trim());
      const isValid = acceptedTypes.some((type) => {
        if (type.startsWith(".")) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        if (type.endsWith("/*")) {
          return file.type.startsWith(type.replace("/*", "/"));
        }
        return file.type === type;
      });
      if (!isValid) {
        return `File "${file.name}" is not an accepted file type`;
      }
    }
    return null;
  };

  const handleFiles = React.useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const validFiles: File[] = [];

      for (const file of fileArray) {
        const validationError = validateFile(file);
        if (validationError) {
          onError?.(validationError);
          continue;
        }
        validFiles.push(file);
      }

      const totalFiles = value.length + validFiles.length;
      if (maxFiles && totalFiles > maxFiles) {
        onError?.(`Cannot add more than ${maxFiles} files`);
        return;
      }

      const updated = multiple ? [...value, ...validFiles] : validFiles;
      onChange?.(updated);
      onDrop?.(validFiles);

      if (showPreviews) {
        validFiles.forEach((file) => {
          const id = file.name + file.size;
          setUploadProgress((prev) => ({ ...prev, [id]: 0 }));
          let progress = 0;
          const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress >= 100) {
              progress = 100;
              clearInterval(interval);
            }
            setUploadProgress((prev) => ({ ...prev, [id]: progress }));
          }, 200);
        });
      }
    },
    [value, multiple, maxFiles, accept, maxSize, onChange, onDrop, onError, showPreviews]
  );

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (e.dataTransfer.files.length) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const removeFile = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    onChange?.(updated);
  };

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer",
          isDragOver
            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
          disabled && "cursor-not-allowed opacity-50",
          error && "border-red-500"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = "";
          }}
          className="sr-only"
        />
        <Upload className="mb-2 h-8 w-8 text-gray-400" />
        <p className="mb-1 text-sm text-gray-600 dark:text-gray-300">
          <span className="font-semibold text-primary-600">Click to upload</span>{" "}
          or drag and drop
        </p>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-500" role="alert">
          {error}
        </p>
      )}

      {value.length > 0 && (
        <div className="mt-3 space-y-2">
          {value.map((file, index) => {
            const id = file.name + file.size;
            const progress = uploadProgress[id] ?? 100;
            return (
              <div
                key={id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              >
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">
                    {file.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                    {progress < 100 && (
                      <div className="flex-1 h-1 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-full rounded-full bg-primary-600 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                    {progress >= 100 && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface ImageUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  onUpload?: (file: File) => Promise<string>;
  accept?: string;
  maxSize?: number;
  className?: string;
  disabled?: boolean;
}

function ImageUpload({
  value,
  onChange,
  onUpload,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024,
  className,
  disabled,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [preview, setPreview] = React.useState(value || "");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setPreview(value || "");
  }, [value]);

  const handleUpload = async (file: File) => {
    if (!onUpload) return;
    setIsUploading(true);
    try {
      const url = await onUpload(file);
      setPreview(url);
      onChange?.(url);
    } catch {
      // Error handled upstream
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors cursor-pointer",
          preview ? "border-transparent" : "border-gray-300 dark:border-gray-600",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        {preview ? (
          <img
            src={preview}
            alt="Upload preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-400">
            <Upload className="h-6 w-6" />
            <span className="text-xs">Upload</span>
          </div>
        )}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const url = URL.createObjectURL(file);
            setPreview(url);
            handleUpload(file);
          }
        }}
        className="sr-only"
      />
      {preview && !disabled && (
        <button
          type="button"
          onClick={() => {
            setPreview("");
            onChange?.("");
          }}
          className="absolute -right-2 -top-2 rounded-full bg-white p-1 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export { FileUpload, ImageUpload, formatFileSize };
