import { CircularProgress } from "@mui/material";

const PageLoader = () => {
  return (
    <div className="flex flex-col justify-center items-center min-h-[60vh] gap-3">
      <CircularProgress size={40} sx={{ color: "#0f766e" }} />
      <p className="text-sm text-gray-500 font-medium animate-pulse">
        Loading...
      </p>
    </div>
  );
};

export default PageLoader;
