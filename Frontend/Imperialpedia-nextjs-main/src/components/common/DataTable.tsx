import React from 'react';

interface DataTableProps {
  columns: string[];
  rows: (string | number)[][];
  caption?: string;
}

/**
 * Simple responsive table used inside MDX articles.
 * Styles are plain‑CSS utilities defined in the global stylesheet.
 */
export const DataTable: React.FC<DataTableProps> = ({ columns, rows, caption }) => (
  <table className="w-full text-left border-collapse my-6">
    {caption && <caption className="mb-2 text-gray-600 text-sm">{caption}</caption>}
    <thead className="bg-gray-100">
      <tr>
        {columns.map((col, i) => (
          <th key={i} className="p-2 border-b">{col}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row, ri) => (
        <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
          {row.map((cell, ci) => (
            <td key={ci} className="p-2 border-b">{cell}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

export default DataTable;
