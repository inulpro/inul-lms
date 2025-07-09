"use client";

import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useCallback, useEffect, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";

import { cn } from "@/lib/utils";
import { getS3PublicUrlSync, isS3Key } from "@/lib/s3-utils";

import { Card, CardContent } from "../ui/card";
import {
  RenderEmptyState,
  RenderErrorState,
  RenderUploadedState,
  RenderUploadingState,
} from "./RenderState";

interface UploaderState {
  id: string | null;
  file: File | null;
  uploading: boolean;
  progress: number;
  key?: string;
  isDeleting: boolean;
  error: boolean;
  objectUrl?: string;
  fileType: "image" | "video";
}

interface iAppProps {
  value?: string;
  onChange?: (value: string) => void;
}

export function Uploader({ value, onChange }: iAppProps) {
  const [fileState, setFileState] = useState<UploaderState>({
    error: false,
    file: null,
    id: null,
    uploading: false,
    progress: 0,
    isDeleting: false,
    fileType: "image",
    key: value,
  });

  async function uploadFile(file: File) {
    setFileState((prev) => ({ ...prev, uploading: true, progress: 0 }));

    try {
      const presignedResponse = await fetch("/api/s3/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          size: file.size,
          isImage: true,
        }),
      });

      if (!presignedResponse.ok) {
        toast.error("Failed to get presigned URL");
        setFileState((prev) => ({
          ...prev,
          uploading: false,
          progress: 0,
          error: true,
        }));

        return;
      }

      const { presignedUrl, key } = await presignedResponse.json();

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentageCompleted = (event.loaded / event.total) * 100;
            setFileState((prev) => ({
              ...prev,
              progress: Math.round(percentageCompleted),
            }));
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 204) {
            setFileState((prev) => ({
              ...prev,
              progress: 100,
              uploading: false,
              key: key,
            }));

            onChange?.(key);
            toast.success("File uploaded successfully");
            resolve();
          } else {
            reject(new Error("Upload failed..."));
          }
        };

        xhr.onerror = () => {
          reject(new Error("Failed to upload file"));
        };

        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });
    } catch {
      toast.error("Something went wrong!");
      setFileState((prev) => ({
        ...prev,
        progress: 0,
        error: true,
        uploading: false,
      }));
    }
  }

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];

        if (fileState.objectUrl && !fileState.objectUrl.startsWith("http")) {
          URL.revokeObjectURL(fileState.objectUrl);
        }

        const objectUrl = URL.createObjectURL(file);

        setFileState({
          file: file,
          uploading: false,
          progress: 0,
          objectUrl: objectUrl,
          error: false,
          id: uuidv4(),
          isDeleting: false,
          fileType: "image",
          key: undefined,
        });

        uploadFile(file);
      }
    },
    [fileState.objectUrl]
  );

  async function handleRemoveFile() {
    if (fileState.isDeleting) return;

    try {
      setFileState((prev) => ({ ...prev, isDeleting: true }));

      // Only call API if we have a key (file was uploaded to S3)
      if (fileState.key) {
        const response = await fetch("/api/s3/delete", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: fileState.key,
          }),
        });

        if (!response.ok) {
          toast.error("Failed to remove file from storage");
          setFileState((prev) => ({
            ...prev,
            isDeleting: false,
            error: true,
          }));
          return;
        }
      }

      // Clean up object URL if it exists
      if (fileState.objectUrl && !fileState.objectUrl.startsWith("http")) {
        URL.revokeObjectURL(fileState.objectUrl);
      }

      onChange?.("");

      setFileState(() => ({
        file: null,
        uploading: false,
        progress: 0,
        objectUrl: undefined,
        error: false,
        fileType: "image",
        id: null,
        isDeleting: false,
        key: undefined,
      }));

      toast.success("File removed successfully");
    } catch {
      toast.error("Error removing file, please try again");
      setFileState((prev) => ({
        ...prev,
        isDeleting: false,
        error: true,
      }));
    }
  }

  function rejectedFiles(fileRejection: FileRejection[]) {
    if (fileRejection.length) {
      const tooManyFiles = fileRejection.find(
        (rejection) => rejection.errors[0].code === "too-many-files"
      );

      const fileSizeToBig = fileRejection.find(
        (rejection) => rejection.errors[0].code === "file-too-large"
      );

      if (fileSizeToBig) {
        toast.error("File size exceeds the limit, max 4 MB");
      }

      if (tooManyFiles) {
        toast.error("Too many files selected, max is 1");
      }
    }
  }

  function renderContent() {
    if (fileState.uploading) {
      return (
        <RenderUploadingState
          file={fileState.file as File}
          progress={fileState.progress}
        />
      );
    }

    if (fileState.error) {
      return <RenderErrorState />;
    }

    // Show preview if we have objectUrl (blob) or key (S3 URL)
    if (fileState.objectUrl || fileState.key) {
      let previewUrl = "";

      if (fileState.objectUrl) {
        previewUrl = fileState.objectUrl;
      } else if (fileState.key) {
        previewUrl = isS3Key(fileState.key)
          ? getS3PublicUrlSync(fileState.key)
          : fileState.key;
      }

      return (
        <RenderUploadedState
          previewUrl={previewUrl}
          isDeleting={fileState.isDeleting}
          handleRemoveFile={handleRemoveFile}
        />
      );
    }

    return <RenderEmptyState isDragActive={isDragActive} />;
  }

  // Initialize state with existing value
  useEffect(() => {
    if (value && value !== fileState.key) {
      setFileState((prev) => ({
        ...prev,
        key: value,
        objectUrl: undefined, // Clear objectUrl when setting from existing value
      }));
    }
  }, [value, fileState.key]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (fileState.objectUrl && !fileState.objectUrl.startsWith("http")) {
        URL.revokeObjectURL(fileState.objectUrl);
      }
    };
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
    multiple: false,
    maxSize: 4 * 1024 * 1024, // 4 MB file size
    onDropRejected: rejectedFiles,
    disabled: fileState.uploading || !!fileState.objectUrl || !!fileState.key,
  });

  return (
    <Card
      {...getRootProps()}
      className={cn(
        "relative border-2 border-dashed transition-colors duration-200 ease-in-out w-full h-48",
        isDragActive
          ? "border-primary bg-primary/10 border-solid"
          : "border-border hover:border-primary"
      )}
    >
      <CardContent className="flex items-center justify-center h-full w-full p-4">
        <input {...getInputProps()} />
        {renderContent()}
      </CardContent>
    </Card>
  );
}
