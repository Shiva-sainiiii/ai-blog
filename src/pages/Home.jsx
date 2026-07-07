import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getAllBlogs } from '../firebase/blogs.js';
import BlogCard from '../components/BlogCard.jsx';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const heroRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getAllBlogs();
        if (!cancelled) setBlogs(data);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError('Could not load posts. Check your Firebase config.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current.querySelectorAll('[data-hero-item]'),
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out' }
      );
    }
  }, []);

  useEffect(() => {
    if (!loading && gridRef.current) {
      const cards = gridRef.current.querySelectorAll('[data-blog-card]');
      cards.forEach((card) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 90%',
              toggleActions: 'play none none none',
            },
          }
        );
      });
    }
    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, [loading, blogs]);

  return (
    <div>
      <section ref={heroRef} className="max-w-5xl mx-auto px-5 md:px-8 pt-16 md:pt-24 pb-14">
        <p data-hero-item className="font-mono text-xs uppercase tracking-[0.2em] text-signal mb-4">
          Human & machine, side by side
        </p>
        <h1
          data-hero-item
          className="font-display text-4xl md:text-6xl font-semibold leading-[1.05] tracking-tight mb-6 max-w-3xl"
        >
          Notes in the margins of an unfinished web.
        </h1>
        <p data-hero-item className="text-parchment/60 text-lg max-w-xl">
          A small blog where posts written by hand sit next to ones drafted with AI —
          each one marked honestly, never hidden.
        </p>
      </section>

      <section ref={gridRef} className="max-w-5xl mx-auto px-5 md:px-8 pb-24">
        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[16/10] bg-white/5" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-full" />
                  <div className="h-3 bg-white/5 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-clay-bright font-medium mb-2">{error}</p>
            <p className="text-parchment/50 text-sm">
              Add your Firebase credentials to .env and make sure Firestore rules allow reads.
            </p>
          </div>
        )}

        {!loading && !error && blogs.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="font-display text-2xl mb-2">Nothing published yet</p>
            <p className="text-parchment/50">
              Sign in as admin and write (or generate) the first post.
            </p>
          </div>
        )}

        {!loading && !error && blogs.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {blogs.map((blog, i) => (
              <BlogCard key={blog.id} blog={blog} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
