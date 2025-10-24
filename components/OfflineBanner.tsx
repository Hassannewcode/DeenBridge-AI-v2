import React from 'react';

const OfflineBanner: React.FC = () => {
  return (
    <div
      role="status"
      aria-live="assertive"
      className="w-full bg-amber-500 text-center text-sm font-semibold text-black p-2 shadow-md z-50"
    >
      You are currently offline. Some features may be unavailable.
    </div>
  );
};

export default OfflineBanner;