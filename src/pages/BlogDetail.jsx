import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { gsap } from 'gsap';
import {
  getBlogById,
  getComments,
  addComment,
  deleteComment,
  toggleLike,
} from '../firebase/blogs.js';
import { useAuth } from '../context/AuthContext.jsx';

// Minimal markdown-ish renderer for ## headings, **bold**, and paragraphs
// without pulling in a full markdown lib. Good enough for AI-generated posts.
function renderContent(markdown) {
  const lines = markdown.split('\n');
  const blocks = [];
  let listBuffer = [];

  const flushList = () => {
    if (listBuffer.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`}>
          {listBuffer.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  function inlineFormat(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code>$1</code>');
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      blocks.push(<h2 key={idx}>{trimmed.slice(3)}</h2>);
    } else if (trimmed.startsWith('### ')) {
      flushList();
      blocks.push(<h3 key={idx}>{trimmed.slice(4)}</h3>);
    } else if (/^[-*]\s+/.test(trimmed)) {
      listBuffer.push(trimmed.replace(/^[-*]\s+/, ''));
    } else if (trimmed.startsWith('> ')) {
      flushList();
      blocks.push(<blockquote key={idx}>{trimmed.slice(2)}</blockquote>);
    } else {
      flushList();
      blocks.push(<p key={idx} dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed) }} />);
    }
  });
  flushList();
  return blocks;
}

export default function BlogDetail() {
  const { id } = useParams();
  const { user, login } = useAuth();
  const [blog, setBlog] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const contentRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [blogData, commentData] = await Promise.all([
          getBlogById(id),
          getComments(id),
        ]);
        if (cancelled) return;
        if (!blogData) {
          setNotFound(true);
        } else {
          setBlog(blogData);
          setLikeCount(blogData.likes || 0);
          setLiked(user ? (blogData.likedBy || []).includes(user.uid) : false);
          setComments(commentData);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load post');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  useEffect(() => {
    if (!loading && contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      );
    }
  }, [loading]);

  const handleLike = async () => {
    if (!user) {
      toast('Sign in to like posts', { icon: '🔒' });
      return;
    }
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      await toggleLike(id, user.uid, liked);
    } catch (err) {
      setLiked(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
      toast.error('Could not update like');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user) {
      toast('Sign in to comment', { icon: '🔒' });
      return;
    }
    if (!commentText.trim()) return;

    setPosting(true);
    try {
      await addComment(id, {
        text: commentText.trim(),
        authorName: user.displayName || 'Anonymous',
        authorId: user.uid,
        authorPhoto: user.photoURL,
      });
      setComments((prev) => [
        { id: `temp-${Date.now()}`, text: commentText.trim(), authorName: user.displayName, authorPhoto: user.photoURL, createdAt: { toDate: () => new Date() } },
        ...prev,
      ]);
      setCommentText('');
      toast.success('Comment posted');
    } catch (err) {
      toast.error('Could not post comment');
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-signal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="font-display text-3xl">Post not found</p>
        <Link to="/" className="btn-ghost">Back to homepage</Link>
      </div>
    );
  }

  const date = blog.createdAt?.toDate ? blog.createdAt.toDate() : new Date();

  return (
    <article ref={contentRef} className="max-w-3xl mx-auto px-5 md:px-8 py-12 md:py-16">
      {blog.aiGenerated && (
        <span className="inline-block text-[11px] tracking-wide uppercase font-mono px-2.5 py-1 rounded-full bg-clay/90 text-ink font-medium mb-5">
          AI-assisted draft
        </span>
      )}

      <h1 className="font-display text-3xl md:text-5xl font-semibold leading-[1.1] mb-4">
        {blog.title}
      </h1>

      <div className="flex items-center gap-4 text-sm text-parchment/50 mb-8">
        <span>{blog.authorName || 'Admin'}</span>
        <span>·</span>
        <span>{formatDistanceToNow(date, { addSuffix: true })}</span>
      </div>

      {blog.imageUrl && (
        <div className="rounded-2xl overflow-hidden mb-10 glass">
          <img src={blog.imageUrl} alt={blog.title} className="w-full h-auto object-cover" />
        </div>
      )}

      <div className="prose-blog">{renderContent(blog.content || '')}</div>

      <div className="flex items-center gap-4 mt-10 pt-8 border-t border-parchment/10">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all ${
            liked
              ? 'border-clay bg-clay/20 text-clay-bright'
              : 'border-parchment/20 hover:border-signal/50 hover:bg-signal/10'
          }`}
        >
          <motion.span animate={liked ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.3 }}>
            {liked ? '♥' : '♡'}
          </motion.span>
          {likeCount} {likeCount === 1 ? 'like' : 'likes'}
        </button>
      </div>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold mb-6">
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </h2>

        {user ? (
          <form onSubmit={handleComment} className="mb-8">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share your thoughts…"
              rows={3}
              className="input-field resize-none mb-3"
            />
            <button type="submit" disabled={posting} className="btn-signal">
              {posting ? 'Posting…' : 'Post comment'}
            </button>
          </form>
        ) : (
          <div className="glass rounded-xl p-5 mb-8 flex items-center justify-between flex-wrap gap-3">
            <p className="text-parchment/60 text-sm">Sign in to join the conversation.</p>
            <button onClick={login} className="btn-ghost text-sm !py-2">
              Sign in with Google
            </button>
          </div>
        )}

        <AnimatePresence>
          <ul className="space-y-4">
            {comments.map((c) => (
              <motion.li
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass rounded-xl p-4 flex gap-3"
              >
                {c.authorPhoto ? (
                  <img src={c.authorPhoto} alt="" className="w-9 h-9 rounded-full flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-signal/20 flex items-center justify-center flex-shrink-0 font-medium text-signal">
                    {(c.authorName || '?')[0]}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{c.authorName}</p>
                  <p className="text-parchment/70 text-sm mt-1">{c.text}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </AnimatePresence>
      </section>
    </article>
  );
}
