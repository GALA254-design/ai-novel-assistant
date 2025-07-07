import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { db } from '../firebase';
import { collection, addDoc, Timestamp, getDocs, query, orderBy } from 'firebase/firestore';
import { FaUserCircle } from 'react-icons/fa';

// Simple star rating component
const StarRating: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        className={`text-base ${star <= value ? 'text-yellow-400' : 'text-gray-300'} focus:outline-none`}
        onClick={() => onChange(star)}
        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
      >
        ★
      </button>
    ))}
  </div>
);

// Simple thumbs up/down rating
const ThumbsRating: React.FC<{ value: 'up' | 'down' | null; onChange: (v: 'up' | 'down') => void }> = ({ value, onChange }) => (
  <div className="flex gap-0.5">
    <button
      type="button"
      className={`text-base ${value === 'up' ? 'text-green-500' : 'text-gray-300'} focus:outline-none`}
      onClick={() => onChange('up')}
      aria-label="Thumbs up"
    >
      👍
    </button>
    <button
      type="button"
      className={`text-base ${value === 'down' ? 'text-red-500' : 'text-gray-300'} focus:outline-none`}
      onClick={() => onChange('down')}
      aria-label="Thumbs down"
    >
      👎
    </button>
  </div>
);

const Feedback: React.FC = () => {
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: '', feedback: '' });
  const [star, setStar] = useState(0);
  const [thumb, setThumb] = useState<'up' | 'down' | null>(null);
  const [comments, setComments] = useState<{ comment: string; createdAt: any; name?: string }[]>([]);
  const [comment, setComment] = useState('');

  // Load comments from Firestore on mount
  useEffect(() => {
    const fetchComments = async () => {
      const qSnap = await getDocs(query(collection(db, 'feedbackComments'), orderBy('createdAt', 'desc')));
      setComments(qSnap.docs.map(doc => doc.data() as { comment: string; createdAt: any; name?: string }));
    };
    fetchComments();
  }, []);

  // Handle feedback form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'feedback'), {
      name: form.name,
      feedback: form.feedback,
      star,
      thumb,
      createdAt: Timestamp.now(),
    });
    setForm({ name: '', feedback: '' });
    setStar(0);
    setThumb(null);
    showToast(
      "Thank you for your feedback! Your thoughts help us improve. 🌟",
      "success"
    );
  };

  // Handle comment submit
  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      await addDoc(collection(db, 'feedbackComments'), {
        comment: comment.trim(),
        createdAt: Timestamp.now(),
      });
      setComments((prev) => [...prev, { comment: comment.trim(), createdAt: Timestamp.now() }]);
      setComment('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a2236] via-[#232946] to-[#121826] dark:from-[#181c2a] dark:via-[#232946] dark:to-[#121826]">
      <div className="w-full max-w-lg mx-auto p-4 md:p-8 flex flex-col items-center justify-center animate-fadeIn">
        <h2 className="text-2xl sm:text-3xl font-heading font-extrabold mb-4 sm:mb-6 text-center bg-gradient-to-r from-blue-700 to-indigo-500 dark:from-orange-300 dark:to-pink-400 bg-clip-text text-transparent drop-shadow">User Feedback</h2>
        <Card className="p-4 sm:p-8 mb-8 w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border-0 animate-fadeIn">
          <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-blue-700 to-indigo-500 dark:from-orange-300 dark:to-pink-400 bg-clip-text text-transparent border-b border-blue-100 dark:border-blue-900 pb-2">Submit Feedback</h3>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit} aria-label="Submit feedback form">
            <Input
              label="Your Name (optional)"
              name="name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Enter your name"
            />
            <div>
              <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">Your Feedback</label>
              <textarea
                className="w-full min-h-[80px] px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 transition-colors duration-300 shadow-sm"
                name="feedback"
                value={form.feedback}
                onChange={e => setForm({ ...form, feedback: e.target.value })}
                placeholder="Share your thoughts..."
                required
                aria-required="true"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              <span className="font-medium text-gray-800 dark:text-gray-200">Rate:</span>
              <div className="flex items-center gap-2">
                <StarRating value={star} onChange={setStar} />
                <ThumbsRating value={thumb} onChange={setThumb} />
              </div>
            </div>
            <Button type="submit" variant="primary" className="w-full py-3 text-base mt-2 shadow-lg focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-orange-400">Submit Feedback</Button>
          </form>
        </Card>
        <Card className="p-4 sm:p-8 w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border-0 animate-fadeIn">
          <h3 className="text-lg sm:text-xl font-extrabold mb-4 bg-gradient-to-r from-blue-700 to-indigo-500 dark:from-orange-300 dark:to-pink-400 bg-clip-text text-transparent border-b border-blue-100 dark:border-blue-900 pb-2 text-center">Comments & Suggestions</h3>
          <form className="flex flex-col sm:flex-row gap-2 mb-4" onSubmit={handleComment} aria-label="Add comment form">
            <input
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 transition-colors duration-300 shadow-sm"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Add a comment..."
              aria-label="Add a comment"
            />
            <Button type="submit" variant="secondary" className="w-full sm:w-auto py-2 text-base shadow focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-orange-400">Send</Button>
          </form>
          <div className="flex flex-col gap-3">
            {comments.length === 0 ? (
              <div className="text-gray-400 text-center">No comments yet.</div>
            ) : (
              comments.map((c, i) => (
                <Card key={i} className="flex items-start gap-3 p-3 bg-white/80 dark:bg-gray-800/80 border border-blue-100 dark:border-blue-900 shadow-none hover:shadow-lg transition-shadow duration-200 group">
                  <div className="flex-shrink-0">
                    {c.name ? (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-200 to-indigo-400 dark:from-blue-900 dark:to-orange-400 flex items-center justify-center text-lg font-bold text-blue-700 dark:text-orange-300 shadow-md">
                        {c.name[0].toUpperCase()}
                      </div>
                    ) : (
                      <FaUserCircle className="w-10 h-10 text-blue-300 dark:text-blue-700" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-blue-700 dark:text-orange-300 mb-1 group-hover:underline">{c.name || 'Anonymous'}</div>
                    <div className="text-gray-800 dark:text-gray-100 mb-1">{c.comment}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">{c.createdAt?.toDate ? c.createdAt.toDate().toLocaleString() : ''}</div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Feedback; 