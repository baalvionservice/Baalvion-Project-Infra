import React from 'react';

interface Props {
  terms: string[];
}

export default function KeyTermsBanner({ terms }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mb-4 px-2 py-1 bg-gray-100 rounded">
      {terms.map((term, idx) => (
        <span
          key={idx}
          className="px-3 py-1 text-sm font-medium text-white bg-[hsl(var(--cnbc-red))] rounded-full"
        >
          {term}
        </span>
      ))}
    </div>
  );
}
