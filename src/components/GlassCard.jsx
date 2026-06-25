import React from "react";

const GlassCard = ({
  children,
  className = ""
}) => {
  return (
    <div
      className={`glass rounded-2xl p-5 shadow-lg ${className}`}
    >
      {children}
    </div>
  );
};

export default GlassCard;
