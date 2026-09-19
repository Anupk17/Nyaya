import React from 'react';

function ConfidenceBadge({ confidence, size = 'md' }) {
  const tier = confidence >= 90 ? 'high' : confidence >= 60 ? 'medium' : 'low';

  const colors = {
    high: 'bg-[#F97316] text-white',
    medium: 'bg-amber-500 text-white',
    low: 'bg-rose-500 text-white'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${colors[tier]} ${sizes[size]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {confidence}% confident
    </span>
  );
}

export default ConfidenceBadge;