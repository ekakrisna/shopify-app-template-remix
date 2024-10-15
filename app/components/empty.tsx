import React from "react";
import NoDataImage from "../images/no-image.ce1531bced5607732c0f.webp";
interface EmptyStateProps {
  title: string;
  onAction?: () => void;
  children?: React.ReactNode;
  imageUrl?: string;
}

const EmptyState = ({
  title,
  onAction,
  children,
  imageUrl,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <img
        src={imageUrl || NoDataImage}
        alt="Empty State"
        className="w-40 h-40 mb-2 rounded"
      />
      <h2 className="mb-2 text-lg font-semibold text-gray-400">{title}</h2>
      {onAction && (
        <button
          className="px-4 py-2 text-white bg-blue-500 rounded-full hover:bg-blue-600"
          onClick={onAction}
        >
          Take Action
        </button>
      )}
      {children}
    </div>
  );
};

export default EmptyState;
