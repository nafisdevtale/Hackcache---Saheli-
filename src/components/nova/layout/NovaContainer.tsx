import React, { type ReactNode } from "react";

export interface NovaContainerProps {
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "full";
  className?: string;
}

const MAX_WIDTHS = {
  sm: "max-w-xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  full: "max-w-full",
};

export const NovaContainer: React.FC<NovaContainerProps> = ({
  children,
  size = "lg",
  className = "",
}) => {
  const maxWidth = MAX_WIDTHS[size];

  return (
    <div className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${maxWidth} ${className}`.trim()}>
      {children}
    </div>
  );
};
