import React from 'react';

const PageHeader = ({ title, description }) => {
  return (
    <div className="pb-5 border-b border-gray-200">
      <h1 className="text-3xl font-bold leading-tight text-gray-900">{title}</h1>
      {description && (
        <p className="mt-2 max-w-4xl text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
};

export default PageHeader; 