import React from "react";

const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center py-10">
      <div className="h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

export default LoadingSpinner;
