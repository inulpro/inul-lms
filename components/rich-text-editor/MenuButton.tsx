import React from "react";
import { cn } from "@/lib/utils";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MenuButtonProps {
  action: () => void;
  isActive: boolean;
  tooltip: string;
  children: React.ReactNode;
}

export function MenuButton({
  action,
  isActive,
  tooltip,
  children,
}: MenuButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          size="sm"
          pressed={isActive}
          onPressedChange={action}
          className={cn(isActive && "bg-muted text-muted-foreground")}
        >
          {children}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
