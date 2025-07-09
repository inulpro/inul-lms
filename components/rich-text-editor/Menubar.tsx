import { type Editor } from "@tiptap/react";
import { Redo2Icon, Undo2Icon } from "lucide-react";
import {
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconBold,
  IconH1,
  IconH2,
  IconH3,
  IconItalic,
  IconList,
  IconListNumbers,
  IconStrikethrough,
} from "@tabler/icons-react";

import { TooltipProvider } from "../ui/tooltip";
import { Button } from "../ui/button";

import { MenuButton } from "./MenuButton";

interface iAppProps {
  editor: Editor | null;
}

export function Menubar({ editor }: iAppProps) {
  if (!editor) {
    return null;
  }

  const menuItems = [
    {
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold"),
      tooltip: "Bold",
      children: <IconBold />,
    },
    {
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic"),
      tooltip: "Italic",
      children: <IconItalic />,
    },
    {
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: editor.isActive("strike"),
      tooltip: "Strike",
      children: <IconStrikethrough />,
    },
    {
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive("heading", { level: 1 }),
      tooltip: "Heading 1",
      children: <IconH1 />,
    },
    {
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive("heading", { level: 2 }),
      tooltip: "Heading 2",
      children: <IconH2 />,
    },
    {
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editor.isActive("heading", { level: 3 }),
      tooltip: "Heading 3",
      children: <IconH3 />,
    },
    {
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive("bulletList"),
      tooltip: "Bullet List",
      children: <IconList />,
    },
    {
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive("orderedList"),
      tooltip: "Ordered List",
      children: <IconListNumbers />,
    },
  ];

  const textAlignItems = [
    {
      action: () => editor.chain().focus().setTextAlign("left").run(),
      isActive: editor.isActive({ textAlign: "left" }),
      tooltip: "Align Left",
      children: <IconAlignLeft />,
    },
    {
      action: () => editor.chain().focus().setTextAlign("center").run(),
      isActive: editor.isActive({ textAlign: "center" }),
      tooltip: "Align Center",
      children: <IconAlignCenter />,
    },
    {
      action: () => editor.chain().focus().setTextAlign("right").run(),
      isActive: editor.isActive({ textAlign: "right" }),
      tooltip: "Align Right",
      children: <IconAlignRight />,
    },
  ];

  return (
    <div className="border border-input border-t-0 border-x-0 rounded-t-lg p-2 bg-card flex flex-wrap gap-1 items-center">
      <TooltipProvider>
        <div className="flex flex-wrap gap-1">
          {menuItems.map((item, index) => (
            <MenuButton key={index} {...item} />
          ))}
        </div>

        <div className="w-px h-6 bg-border mx-2"></div>
        <div className="flex flex-wrap gap-1">
          {textAlignItems.map((item, index) => (
            <MenuButton key={index} {...item} />
          ))}
        </div>

        <div className="w-px h-6 bg-border mx-2"></div>
        <div className="flex flex-wrap gap-1">
          <Button
            size="sm"
            variant="ghost"
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo2Icon />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo2Icon />
          </Button>
        </div>
      </TooltipProvider>
    </div>
  );
}
