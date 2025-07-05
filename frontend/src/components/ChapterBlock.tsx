import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import { FiEdit, FiSave, FiX, FiTrash2, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { Chapter } from '../services/storyService';

interface ChapterBlockProps {
  chapter: Chapter;
  index: number;
  isEditing: boolean;
  onEdit: (index: number) => void;
  onSave: (index: number, title: string, content: string) => void;
  onCancel: () => void;
  onDelete: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const ChapterBlock: React.FC<ChapterBlockProps> = ({
  chapter,
  index,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}) => {
  const [title, setTitle] = useState(chapter.title);
  const [content, setContent] = useState(chapter.content);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTitle(chapter.title);
    setContent(chapter.content);
  }, [chapter]);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(index, title, content);
    setIsSaving(false);
  };

  const handleCancel = () => {
    setTitle(chapter.title);
    setContent(chapter.content);
    onCancel();
  };

  return (
    <div className="w-full max-w-none lg:max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-0 my-4 sm:my-8 animate-fadeIn">
      {isEditing ? (
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="flex items-center justify-between px-4 sm:px-6 pt-6 sm:pt-8">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="CHAPTER TITLE"
              className="flex-1 text-lg sm:text-xl lg:text-2xl font-bold bg-transparent outline-none px-2 py-2 border-b-2 border-blue-200 dark:border-orange-700 focus:border-blue-400 dark:focus:border-orange-400"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => onMoveUp(index)}
                disabled={!canMoveUp}
                className="p-2"
              >
                <FiChevronUp className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                onClick={() => onMoveDown(index)}
                disabled={!canMoveDown}
                className="p-2"
              >
                <FiChevronDown className="w-4 h-4" />
              </Button>
              <Button
                variant="danger"
                onClick={() => onDelete(index)}
                className="p-2"
              >
                <FiTrash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your chapter content here..."
            className="w-full min-h-[50vh] sm:min-h-[60vh] bg-transparent outline-none resize-none px-4 sm:px-6 pb-6 sm:pb-8 text-base sm:text-lg lg:text-xl leading-relaxed font-medium rounded-b-2xl"
            style={{ fontFamily: 'serif', boxShadow: 'none', border: 'none' }}
          />
          <div className="flex flex-col sm:flex-row gap-2 px-4 sm:px-6 pb-4 sm:pb-6">
            <Button 
              variant="primary" 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <FiSave className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Chapter'}
            </Button>
            <Button variant="secondary" onClick={handleCancel} className="flex items-center gap-2">
              <FiX className="w-4 h-4" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-orange-300 mb-2">
                {chapter.title}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="primary" onClick={() => onEdit(index)} className="flex items-center gap-2 w-full sm:w-auto">
                <FiEdit className="w-4 h-4" />
                Edit Chapter
              </Button>
            </div>
          </div>
          <div className="prose prose-blue dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed text-gray-900 dark:text-gray-100 whitespace-pre-line">
            {chapter.content}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChapterBlock; 