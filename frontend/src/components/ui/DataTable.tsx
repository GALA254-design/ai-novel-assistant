import React, { useState } from 'react';
import { FiTrash2, FiEye, FiEdit, FiMoreVertical } from 'react-icons/fi';

interface DataTableProps {
  columns: { label: string; key: string; sortable?: boolean }[];
  data: Record<string, any>[];
  onBatchDelete?: (selectedIndexes: number[]) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  loading?: boolean;
  emptyMessage?: string;
}

// Premium DataTable component for displaying tabular data, accessible and responsive
export const DataTable: React.FC<DataTableProps> = ({ 
  columns, 
  data, 
  onBatchDelete, 
  onSort,
  loading = false,
  emptyMessage = "No data found."
}) => {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSelectRow = (idx: number) => {
    setSelectedRows((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === data.length) setSelectedRows([]);
    else setSelectedRows(data.map((_, i) => i));
  };

  const handleSort = (key: string) => {
    if (!onSort) return;
    
    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDirection(newDirection);
    onSort(key, newDirection);
  };

  const getSortIcon = (key: string) => {
    if (sortKey !== key) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="animate-pulse">
          <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-t-xl"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Mobile Card Layout */}
      <div className="block lg:hidden space-y-4">
        {data.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-slate-400 dark:text-slate-500 text-6xl mb-4">📚</div>
            <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">{emptyMessage}</p>
          </div>
        ) : (
          data.map((row, i) => (
            <div
              key={i}
              className={`
                rounded-3xl shadow-2xl border-0 bg-gradient-to-br from-white via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 p-6 flex flex-col gap-4
                transition-all duration-200 hover:shadow-3xl hover:scale-[1.02] cursor-pointer group
                ${selectedRows.includes(i) 
                  ? 'ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }
              `}
              tabIndex={0} 
              aria-selected={selectedRows.includes(i)}
              onClick={() => row.onView && row.onView()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-xl text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {row.title}
                </h3>
                <input
                  type="checkbox"
                  checked={selectedRows.includes(i)}
                  onChange={e => { e.stopPropagation(); handleSelectRow(i); }}
                  aria-label={`Select ${row.title}`}
                  className="w-6 h-6 accent-blue-500 dark:accent-blue-400 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-xl transition-all duration-200 border-2 border-blue-200 dark:border-blue-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-base">
                <div>
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Author:</span>
                  <span className="ml-2 text-slate-900 dark:text-slate-100 break-words whitespace-normal">{row.author}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Status:</span>
                  <span className={`ml-2 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                    row.status === 'Published' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                    row.status === 'Draft' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                    'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {row.status}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Updated:</span>
                  <span className="ml-2 text-slate-900 dark:text-slate-100 break-words whitespace-normal">{row.updated}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow transition-all duration-200 text-sm flex items-center justify-center gap-2"
                  onClick={e => { e.stopPropagation(); row.onView && row.onView(); }}
                  aria-label={`View ${row.title}`}
                >
                  <FiEye /> View
                </button>
                <button
                  className="flex-1 py-2 rounded-xl bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold shadow transition-all duration-200 text-sm flex items-center justify-center gap-2"
                  onClick={e => { e.stopPropagation(); row.onPreview && row.onPreview(); }}
                  aria-label={`Preview ${row.title}`}
                >
                  <FiEye /> Preview
                </button>
                <button
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow transition-all duration-200 text-sm flex items-center justify-center gap-2"
                  onClick={e => { e.stopPropagation(); row.onDelete && row.onDelete(); }}
                  aria-label={`Delete ${row.title}`}
                >
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Pill/List Layout (replace table with flex list) */}
      {typeof window !== 'undefined' && window.innerWidth >= 1024 && (
        <div className="hidden lg:flex flex-col gap-3 w-full">
          {data.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-slate-400 dark:text-slate-500 text-6xl mb-4">📚</div>
              <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">{emptyMessage}</p>
            </div>
          ) : (
            data.map((row, i) => (
              <div
                key={i}
                className={`flex items-center gap-4 px-6 py-3 rounded-full shadow-md bg-gradient-to-r from-blue-50 via-white to-indigo-50 dark:from-blue-900 dark:via-slate-900 dark:to-indigo-950 border border-blue-100 dark:border-blue-900/30 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] min-h-[56px]`}
              >
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="font-extrabold text-base text-slate-900 dark:text-slate-100 truncate">{row.title}</div>
                  <div className="flex gap-3 text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                    <span className="break-words whitespace-normal">{row.genre}</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold">{row.tone}</span>
                    <span className="break-words whitespace-normal">{row.updatedAt}</span>
                  </div>
          </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold shadow transition-all duration-200 text-sm flex items-center gap-2"
                    onClick={e => { e.stopPropagation(); row.onView && row.onView(); }}
                    aria-label={`View ${row.title}`}
                  >
                    <FiEye /> View
                  </button>
                  <button
                    className="px-4 py-2 rounded-full bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold shadow transition-all duration-200 text-sm flex items-center gap-2"
                    onClick={e => { e.stopPropagation(); row.onPreview && row.onPreview(); }}
                    aria-label={`Preview ${row.title}`}
                  >
                    <FiEye /> Preview
                  </button>
                  <button
                    className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold shadow transition-all duration-200 text-sm flex items-center gap-2"
                    onClick={e => { e.stopPropagation(); row.onDelete && row.onDelete(); }}
                    aria-label={`Delete ${row.title}`}
                  >
                    <FiTrash2 /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
      </div>
      )}
    </div>
  );
}; 