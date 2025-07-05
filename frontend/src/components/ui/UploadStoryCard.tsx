import React, { useRef, useState } from 'react';
import Button from './Button';
import Loader from './Loader';
import { FiUpload, FiFileText, FiFile } from 'react-icons/fi';
import Modal from './Modal';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createProject, addChapter } from '../../services/storyService';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

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

  // Client-side PDF text extraction
  const extractPdfTextClient = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        text += pageText + '\n';
      }
      
      return text;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  };

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
          text = await extractPdfTextClient(file);
          setPreview(text.slice(0, 2000) + (text.length > 2000 ? '... (truncated)' : ''));
          setLoading(false);
          return;
        } catch (err) {
          console.error('PDF extraction error:', err);
          setError('PDF cannot be read. Please use a text file or copy-paste your story to continue.');
          setShowManualEntry(true);
          setFile(file);
          setLoading(false);
          return;
        }
      } else if (ext === 'docx' || ext === 'doc') {
        try {
          // For DOCX/DOC, we'll use server-side extraction as fallback
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await fetch('/api/files/extract-pdf', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error('Failed to extract DOCX');
          }
          
          const data = await response.json();
          text = data.text;
          setPreview(text.slice(0, 2000) + (text.length > 2000 ? '... (truncated)' : ''));
          setLoading(false);
          return;
        } catch (err) {
          console.error('DOCX extraction error:', err);
          setError('Unsupported or unreadable file format (DOCX). You can manually paste the text below.');
          setShowManualEntry(true);
          setFile(file);
          setLoading(false);
          return;
        }
      } else if (ext === 'txt' || ext === 'rtf' || ext === 'md' || ext === 'html' || ext === 'htm') {
        try {
          const reader = new FileReader();
          reader.onload = (e) => {
            text = e.target?.result as string;
            setPreview(text.slice(0, 2000) + (text.length > 2000 ? '... (truncated)' : ''));
            setLoading(false);
          };
          reader.onerror = () => {
            setError('Unsupported or unreadable file format.');
            setFile(null);
            setLoading(false);
          };
          reader.readAsText(file);
          return;
        } catch (err) {
          setError('Unsupported or unreadable file format.');
          setFile(null);
          setLoading(false);
          return;
        }
      } else {
        setError('Unsupported file type. Please upload a PDF, DOCX, DOC, TXT, RTF, MD, or HTML file.');
        setFile(null);
        setLoading(false);
        return;
      }
    } catch (e) {
      setError('Failed to read file.');
      setFile(null);
      setLoading(false);
    }
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
    <div className="bg-gradient-to-br from-white via-blue-50 to-indigo-50 dark:from-blue-950 dark:via-slate-900 dark:to-indigo-950 border-2 border-dashed border-blue-300 dark:border-orange-400 rounded-3xl p-8 sm:p-10 shadow-2xl mb-10 animate-fadeIn transition-all duration-300">
      <h3 className="text-2xl font-extrabold text-blue-700 dark:text-orange-300 mb-4 flex items-center gap-3 tracking-tight">
        <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-orange-400 dark:to-pink-600 shadow-lg mr-2">
          <FiUpload className="w-7 h-7 text-white" />
        </span>
        Upload Story Files
      </h3>
      <div
        className={`flex flex-col items-center justify-center border-2 rounded-2xl border-dashed transition-all duration-200 p-8 sm:p-10 mb-6 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/40' : 'border-blue-200 dark:border-orange-700 bg-white/80 dark:bg-blue-950/80'}`}
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
          accept=".pdf,.docx,.doc,.txt,.rtf,.md,.html,.htm"
          className="hidden"
          ref={inputRef}
          onChange={handleChange}
        />
        <div className="flex flex-col items-center gap-3">
          {file ? (
            <>
              {(file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') || file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc')) ? <FiFile className="w-10 h-10 text-blue-500 dark:text-orange-300" /> : <FiFileText className="w-10 h-10 text-blue-500 dark:text-orange-300" />}
              <span className="font-semibold text-blue-700 dark:text-orange-200 text-lg">{file.name}</span>
            </>
          ) : (
            <>
              <FiUpload className="w-10 h-10 text-blue-400 dark:text-orange-400" />
              <span className="text-blue-600 dark:text-orange-200 text-base font-medium text-center">Drag & drop or click to select a PDF, DOCX, DOC, TXT, RTF, MD, or HTML file</span>
            </>
          )}
        </div>
      </div>
      {loading && <Loader className="my-4" />}
      {error && <div className="text-red-600 dark:text-pink-400 mb-3 text-base font-semibold">{error}</div>}
      {preview && (
        <div className="bg-blue-50 dark:bg-blue-900/60 rounded-xl p-5 mb-3 max-h-56 overflow-auto text-base text-blue-900 dark:text-blue-100 shadow-inner border border-blue-100 dark:border-blue-800">
          <div className="font-bold mb-2">Preview:</div>
          <pre className="whitespace-pre-wrap break-words font-mono text-sm">{preview}</pre>
        </div>
      )}
      <Button
        variant="primary"
        className="w-full mt-3 text-lg font-bold py-3 shadow-lg hover:shadow-2xl transition-all duration-200"
        onClick={handleUpload ? () => handleUpload(preview, file!) : undefined}
        disabled={!file || !preview || loading}
      >
        Upload Story
      </Button>
    </div>
  );
};

export default UploadStoryCard;