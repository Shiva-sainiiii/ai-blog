import { useState, useRef } from 'react';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';

export default function AIGeneratePanel({ onGenerated }) {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const statusRef = useRef(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Enter a topic first');
      return;
    }

    setLoading(true);
    if (statusRef.current) {
      gsap.fromTo(
        statusRef.current,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
      );
    }

    try {
      const res = await fetch('/api/generate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      onGenerated({
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        aiGenerated: true,
      });

      toast.success('Draft generated — review before publishing');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Could not generate blog. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-5 ai-strip">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-clay animate-pulse" />
        <h3 className="font-display text-lg font-semibold">Generate with AI</h3>
      </div>
      <p className="text-sm text-parchment/60 mb-4">
        Give it a topic. The serverless function calls OpenRouter (Mistral 7B) — your key never
        touches the browser.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          placeholder="e.g. React Hooks explained simply"
          className="input-field flex-1"
          disabled={loading}
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="btn-signal whitespace-nowrap"
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-ink/40 border-t-ink rounded-full animate-spin" />
              Writing…
            </>
          ) : (
            '✦ Generate draft'
          )}
        </button>
      </div>

      {loading && (
        <p ref={statusRef} className="text-xs text-clay-bright mt-3 font-mono">
          Mistral 7B is drafting your post — this usually takes 5–15s.
        </p>
      )}
    </div>
  );
}
