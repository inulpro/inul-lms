"use client";

import { toast } from "sonner";
import { useState, useEffect } from "react";
import { type Editor } from "@tiptap/react";
import { Link2, Unlink } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface LinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editor: Editor | null;
}

export function LinkDialog({ open, onOpenChange, editor }: LinkDialogProps) {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [openInNewTab, setOpenInNewTab] = useState(false);

  useEffect(() => {
    if (open && editor) {
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to);
      setText(selectedText);

      // Check if current selection is a link
      const linkAttrs = editor.getAttributes("link");
      if (linkAttrs.href) {
        setUrl(linkAttrs.href);
        setOpenInNewTab(linkAttrs.target === "_blank");
      } else {
        setUrl("");
        setOpenInNewTab(false);
      }
    }
  }, [open, editor]);

  const handleInsertLink = () => {
    if (!editor) return;

    if (!url.trim()) {
      toast.error("Please enter a valid URL");
      return;
    }

    // Validate URL format
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    const finalUrl = url.startsWith("http") ? url : `https://${url}`;
    const linkAttrs = {
      href: finalUrl,
      target: openInNewTab ? "_blank" : null,
      rel: openInNewTab ? "noopener noreferrer" : null,
    };

    if (text && !editor.state.selection.empty) {
      // Replace selected text with link
      editor
        .chain()
        .focus()
        .deleteSelection()
        .insertContent(
          `<a href="${finalUrl}"${
            openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : ""
          }>${text}</a>`
        )
        .run();
    } else if (text) {
      // Insert new link with text
      editor
        .chain()
        .focus()
        .insertContent(
          `<a href="${finalUrl}"${
            openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : ""
          }>${text}</a>`
        )
        .run();
    } else {
      // Just set link on current selection
      editor.chain().focus().setLink(linkAttrs).run();
    }

    handleClose();
  };

  const handleRemoveLink = () => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
    handleClose();
  };

  const handleClose = () => {
    setUrl("");
    setText("");
    setOpenInNewTab(false);
    onOpenChange(false);
  };

  const isLinkActive = editor?.isActive("link");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            {isLinkActive ? "Edit Link" : "Insert Link"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link-text">Link Text</Label>
            <Input
              id="link-text"
              placeholder="Link text (optional)"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="new-tab"
              checked={openInNewTab}
              onCheckedChange={(checked) => setOpenInNewTab(checked as boolean)}
            />
            <Label htmlFor="new-tab" className="text-sm">
              Open in new tab
            </Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleInsertLink} className="flex-1">
              {isLinkActive ? "Update Link" : "Insert Link"}
            </Button>
            {isLinkActive && (
              <Button variant="outline" onClick={handleRemoveLink}>
                <Unlink className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
