import React from "react";
import { CircularProgress } from "@mui/material";

export const LoadingSpinner: React.FC<{ message?: string }> = ({
  message = "Loading data...",
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <CircularProgress size={36} color="primary" />
      <p className="text-sm font-medium text-muted-foreground animate-pulse">{message}</p>
    </div>
  );
};
