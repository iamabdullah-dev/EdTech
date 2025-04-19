import React from 'react';
import Link from 'next/link';

const EmptyState = ({ message, actionText, actionLink }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50 rounded-lg">
      <div className="text-gray-400 mb-4">
        <svg
          className="mx-auto h-12 w-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>
      <h3 className="mt-2 text-lg font-medium text-gray-900">{message}</h3>
      {actionText && actionLink && (
        <div className="mt-6">
          <Link
            href={actionLink}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {actionText}
          </Link>
        </div>
      )}
    </div>
  );
};

export default EmptyState; 