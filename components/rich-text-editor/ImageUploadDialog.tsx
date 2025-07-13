"use client";

import { toast } from "sonner";
import { useState } from "react";
import { Upload, Link2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageInsert: (src: string, alt?: string) => void;
}

export function ImageUploadDialog({
  open,
  onOpenChange,
  onImageInsert,
}: ImageUploadDialogProps) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleUrlInsert = () => {
    if (!url.trim()) {
      toast.error("Please enter a valid URL");
      return;
    }
    onImageInsert(url, alt);
    setUrl("");
    setAlt("");
    onOpenChange(false);
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/s3/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const { url: uploadedUrl } = await response.json();
      onImageInsert(uploadedUrl, file.name);
      onOpenChange(false);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Insert Image</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="url" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url">
              <Link2 className="w-4 h-4 mr-2" />
              URL
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                placeholder="https://example.com/image.jpg"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-alt">Alt Text (Optional)</Label>
              <Input
                id="image-alt"
                placeholder="Description of the image"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
              />
            </div>
            <Button onClick={handleUrlInsert} className="w-full">
              Insert Image
            </Button>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Click to upload or drag and drop
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
                id="file-upload"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById("file-upload")?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Choose File"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
