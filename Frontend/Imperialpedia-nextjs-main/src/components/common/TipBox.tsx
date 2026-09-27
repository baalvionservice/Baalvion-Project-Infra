import React from 'react';

interface TipBoxProps {
  children: React.ReactNode;
  title?: string;
}

/**
 * A stylized tip / call‑out box used inside MDX articles.
 * Uses Tailwind‑like utility classes (plain CSS classes defined in the project's stylesheet).
 */
export const TipBox: React.FC<TipBoxProps> = ({ children, title = 'Tip' }) => (
  <aside className="bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-300 p-4 my-6 rounded-md shadow-sm">
    <strong className="block text-indigo-800 mb-2">{title}</strong>
    <div className="text-indigo-900 leading-relaxed">{children}</div>
  </aside>
);

export default TipBox;
