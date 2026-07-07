import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function BlogCard({ blog, index }) {
  const date = blog.createdAt?.toDate ? blog.createdAt.toDate() : new Date();

  return (
    <Link
      to={`/blog/${blog.id}`}
      data-blog-card
      className={`group block glass rounded-2xl overflow-hidden hover:border-signal/40 transition-colors duration-300 ${
        blog.aiGenerated ? 'ai-strip' : ''
      }`}
      style={{ transitionDelay: `${(index % 6) * 40}ms` }}
    >
      <div className="aspect-[16/10] overflow-hidden bg-ink-lighter relative">
        {blog.imageUrl ? (
          <img
            src={blog.imageUrl}
            alt={blog.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ink-lighter to-ink-light">
            <span className="font-display text-4xl text-signal/30">◆</span>
          </div>
        )}
        {blog.aiGenerated && (
          <span className="absolute top-3 right-3 text-[11px] tracking-wide uppercase font-mono px-2 py-1 rounded-full bg-clay/90 text-ink font-medium">
            AI-assisted
          </span>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-display text-xl font-semibold leading-snug mb-2 group-hover:text-signal transition-colors">
          {blog.title}
        </h3>
        <p className="text-parchment/60 text-sm leading-relaxed line-clamp-2 mb-4">
          {blog.excerpt}
        </p>
        <div className="flex items-center justify-between text-xs text-parchment/40">
          <span>{formatDistanceToNow(date, { addSuffix: true })}</span>
          <span className="flex items-center gap-1">
            ♥ {blog.likes || 0}
          </span>
        </div>
      </div>
    </Link>
  );
}
