import React from 'react';

interface Props {
  items: string[];
}

export default function KeyTakeaways({ items }: Props) {
  return (
    <ul className="list-disc list-inside mb-6 space-y-2">
      {items.map((item, idx) => (
        <li key={idx} className="text-gray-700">
          {item}
        </li>
      ))}
    </ul>
  );
}
