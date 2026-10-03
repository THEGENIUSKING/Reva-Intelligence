import React from 'react';

export function PageLoader({ label = "Loading data..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full gap-4 opacity-80 animate-in fade-in duration-500">
      <div className="relative flex items-center justify-center w-12 h-12">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="material-symbols-outlined absolute text-[16px] text-primary animate-pulse">model_training</span>
      </div>
      <p className="text-xs font-bold text-secondary uppercase tracking-widest">{label}</p>
    </div>
  );
}
