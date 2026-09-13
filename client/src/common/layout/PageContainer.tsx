import React from "react";

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Max width constraint. Defaults to '7xl' (1280px) */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "7xl" | "full";
  /** Optional override to remove vertical or horizontal padding */
  noPadding?: boolean;
}

const maxWidthClasses: Record<NonNullable<PageContainerProps["maxWidth"]>, string> = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
};

/**
 * Standardized PageContainer component.
 * Enforces predictable responsive boundaries, prevents edge clipping,
 * and maintains unified padding scale across mobile, tablet, and desktop viewports.
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = "7xl",
  noPadding = false,
  className = "",
  ...props
}) => {
  const maxW = maxWidthClasses[maxWidth] || maxWidthClasses["7xl"];
  const padding = noPadding
    ? ""
    : "px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8";

  return (
    <div
      className={`w-full ${maxW} mx-auto min-w-0 min-h-[calc(100vh-140px)] flex flex-col ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default PageContainer;
