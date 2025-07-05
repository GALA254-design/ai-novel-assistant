import React, { useRef, useState } from 'react';

interface FileUploadProps {
  maxSizeMB?: number;
  onFileRead?: (content: string, file: File) => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  maxSizeMB = 2,
  onFileRead,
  accept = '.txt',
  multiple = false,
  label = 'Upload File',
}) => {
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [fileContents, setFileContents] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    setError('');
    setFileContents([]);
    if (!files || files.length === 0) return;
    const names: string[] = [];
    const contents: string[] = [];
    Array.from(files).forEach((file) => {
      if (accept && !file.name.match(new RegExp(accept.replace(/\./g, '\\.').replace(/,/g, '|') + '$', 'i'))) {
        setError('Invalid file type.');
        return;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File is too large. Max size is ${maxSizeMB}MB.`);
        return;
      }
      names.push(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        contents.push(text);
        if (onFileRead) onFileRead(text, file);
        setFileContents([...contents]);
      };
      reader.onerror = () => setError('Failed to read file.');
      reader.readAsText(file);
    });
    setFileNames(names);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      className={`w-full max-w-lg mx-auto flex flex-col gap-4 p-6 bg-gradient-to-br from-white via-blue-50 to-slate-50 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 rounded-2xl shadow-2xl border-2 border-dashed transition-all duration-300 ${dragActive ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/80 scale-[1.01] shadow-blue-200 dark:shadow-blue-900' : 'border-slate-200 dark:border-slate-700'}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      tabIndex={0}
      aria-label={label}
      role="region"
    >
      <label className="block font-semibold text-slate-800 dark:text-slate-100 mb-2 text-base">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleFileChange}
        aria-label={label}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Choose File
      </button>
      <div className="text-center text-slate-500 dark:text-slate-400 text-xs">or drag & drop here</div>
      {fileNames.length > 0 && (
        <div className="text-sm text-slate-700 dark:text-slate-200 truncate">Selected: <span className="font-medium">{fileNames.join(', ')}</span></div>
      )}
      {error && (
        <div className="text-red-600 dark:text-red-400 text-sm font-semibold rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-2 mt-2 shadow" role="alert">{error}</div>
      )}
      {fileContents.length > 0 && (
        <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 max-h-40 overflow-auto whitespace-pre-line shadow-inner animate-fadeIn">
          {fileContents.map((content, i) => (
            <div key={i} className="mb-2">
              {content.slice(0, 2000) || 'No preview available.'}
              {content.length > 2000 && <span className="text-slate-400">... (truncated)</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload; 