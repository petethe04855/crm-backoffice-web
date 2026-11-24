import React from "react";
import { cn } from "@/lib/utils";

interface TwoColumnLayoutProps {
  sidebar: React.ReactNode;
  content: React.ReactNode;
  sidebarWidth?: string;
  /** Put the panel above the content (full width) instead of beside it — used for search/filter panels. */
  filtersOnTop?: boolean;
  className?: string;
}

export const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({
  sidebar,
  content,
  sidebarWidth = "w-full lg:w-80",
  filtersOnTop = false,
  className,
}) => {
  if (filtersOnTop) {
    return (
      <div className={cn("mt-6 flex flex-col gap-6", className)}>
        <section className="w-full">{sidebar}</section>
        <div className="w-full min-w-0">{content}</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col lg:flex-row gap-6 items-start mt-6",
        className,
      )}
    >
      {/* Column 1: Search & Filter Panel */}
      <aside className={cn("shrink-0", sidebarWidth)}>{sidebar}</aside>

      {/* Column 2: Content & Table Area */}
      <main className="flex-1 w-full min-w-0">{content}</main>
    </div>
  );
};
