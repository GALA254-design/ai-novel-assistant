import React, { useRef, useState } from 'react';
import Button from './Button';
import Loader from './Loader';
import { FiUpload, FiFileText, FiFile } from 'react-icons/fi';
import Modal from './Modal';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createProject, addChapter } from '../../services/storyService';
import { extractPdfText } from '../../services/pdfService';

interface UploadStoryCardProps {
  onUpload?: (text: string, file: File) => Promise<void>;
  onStoryExtracted?: (storyText: string) => void;
}

const UploadStoryCard: React.FC<UploadStoryCardProps> = ({ onUpload, onStoryExtracted }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);

  const handleFile = async (file: File) => {
    setError('');
    setPreview('');
    setFile(file);
    setLoading(true);
    setShowManualEntry(false);
    try {
      let text = '';
      const ext = file.name.toLowerCase().split('.').pop();
      if (ext === 'pdf') {
        try {
          text = await extractPdfText(file);
        } catch (err) {
          console.error('PDF extraction error:', err);
          setError('PDF cannot be read. Please use a text file or copy-paste your story to continue.');
          setShowManualEntry(true);
          setFile(file);
          setLoading(false);
          return;
        }
      } else if (ext === 'docx') {
        try {
          text = await extractPdfText(file);
        } catch (err) {
          console.error('DOCX extraction error:', err);
          setError('Unsupported or unreadable file format (DOCX). You can manually paste the text below.');
          setShowManualEntry(true);
          setFile(file);
          setLoading(false);
          return;
        }
      } else if (ext === 'txt') {
        try {
          const reader = new FileReader();
          reader.onload = (e) => {
            text = e.target?.result as string;
            setPreview(text.slice(0, 2000) + (text.length > 2000 ? '... (truncated)' : ''));
            setLoading(false);
            if (onStoryExtracted) onStoryExtracted(text);
          };
          reader.onerror = () => {
            setError('Unsupported or unreadable file format (TXT).');
            setFile(null);
            setLoading(false);
          };
          reader.readAsText(file);
          return;
        } catch (err) {
          setError('Unsupported or unreadable file format (TXT).');
          setFile(null);
        }
      } else {
        setError('Unsupported file type. Please upload a PDF, DOCX, or plain text (.txt) file.');
        setFile(null);
        setLoading(false);
        return;
      }
      if (text) {
        setPreview(text.slice(0, 2000) + (text.length > 2000 ? '... (truncated)' : ''));
        if (onStoryExtracted) onStoryExtracted(text);
        setLoading(false);
        return;
      }
    } catch (e) {
      setError('Failed to read file.');
      setFile(null);
    }
    setLoading(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleUpload = onUpload
    ? async (text: string, file: File) => {
        await onUpload(text, file);
      }
    : undefined;

  if (showManualEntry) {
    return (
      <div className="bg-white dark:bg-blue-950 border-2 border-dashed border-blue-300 dark:border-orange-400 rounded-2xl p-6 shadow-xl mb-8 animate-fadeIn">
        <h3 className="text-xl font-bold text-blue-700 dark:text-orange-300 mb-2 flex items-center gap-2">
          <FiUpload className="inline-block" /> Manual Text Entry
        </h3>
        <div className="mb-2 text-red-600 dark:text-pink-400">PDF extraction failed. Please paste your story text below.</div>
        <textarea
          className="w-full min-h-[180px] px-4 py-3 rounded-xl shadow border border-blue-100 dark:border-blue-800 bg-white/80 dark:bg-blue-950/80 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 transition-all duration-300 mb-4"
          value={preview}
          onChange={e => setPreview(e.target.value)}
          placeholder="Paste your story text here..."
        />
        <Button
          variant="primary"
          className="w-full mt-2"
          onClick={async () => {
            setPreview(preview);
            setShowManualEntry(false);
          }}
          disabled={!preview.trim()}
        >
          Continue
        </Button>
        <Button
          variant="secondary"
          className="w-full mt-2"
          onClick={() => { setShowManualEntry(false); setFile(null); setPreview(''); setError(''); }}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-blue-950 border-2 border-dashed border-blue-300 dark:border-orange-400 rounded-2xl p-6 shadow-xl mb-8 animate-fadeIn">
      <h3 className="text-xl font-bold text-blue-700 dark:text-orange-300 mb-2 flex items-center gap-2">
        <FiUpload className="inline-block" /> Upload PDF or Text Story
      </h3>
      <div
        className={`flex flex-col items-center justify-center border-2 rounded-xl border-dashed transition-all duration-200 p-6 mb-4 w-full cursor-pointer ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/40' : 'border-blue-200 dark:border-orange-700 bg-white dark:bg-blue-950'}`}
        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        tabIndex={0}
        role="button"
        aria-label="Upload story file"
      >
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          ref={inputRef}
          onChange={handleChange}
        />
        <div className="flex flex-col items-center gap-2">
          {file ? (
            <>
              {(file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') || file.name.toLowerCase().endsWith('.docx')) ? <FiFile className="w-8 h-8 text-blue-500 dark:text-orange-300" /> : <FiFileText className="w-8 h-8 text-blue-500 dark:text-orange-300" />}
              <span className="font-medium text-blue-700 dark:text-orange-200">{file.name}</span>
            </>
          ) : (
            <>
              <FiUpload className="w-8 h-8 text-blue-400 dark:text-orange-400" />
              <span className="text-blue-500 dark:text-orange-200">Drag & drop or click to select a PDF, DOCX, or .txt file</span>
            </>
          )}
        </div>
      </div>
      {loading && <Loader className="my-2" />}
      {error && <div className="text-red-600 dark:text-pink-400 mb-2">{error}</div>}
      {preview && (
        <div className="bg-blue-50 dark:bg-blue-900/60 rounded-lg p-4 mb-2 max-h-48 overflow-auto text-sm text-blue-900 dark:text-blue-100 shadow-inner">
          <div className="font-bold mb-1">Preview:</div>
          <pre className="whitespace-pre-wrap break-words">{preview}</pre>
        </div>
      )}
      <Button
        variant="primary"
        className="w-full mt-2"
        onClick={handleUpload ? () => handleUpload(preview, file!) : undefined}
        disabled={!file || !preview || loading}
      >
        Upload Story
      </Button>
    </div>
  );
};

export default UploadStoryCard; 