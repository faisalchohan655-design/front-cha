import React from "react";
import GlassCard from "./GlassCard";

const StatCard = ({
  title,
  value,
  icon: Icon
}) => {
  return (
    <GlassCard>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-400 text-sm">
            {title}
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {value}
          </h2>
        </div>

        {Icon && (
          <Icon
            size={22}
            className="text-pink-400"
          />
        )}
      </div>
    </GlassCard>
  );
};

export default StatCard;
