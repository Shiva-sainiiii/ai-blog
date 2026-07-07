import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getAllBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
} from '../firebase/blogs.js';
import { uploadBlogImage, deleteBlogImage } from '../utils/cloudinary.js';
import { useAuth } from '../context/AuthContext.jsx';
import AIGeneratePanel from '../components/AIGeneratePanel.jsx';

const emptyForm = {
  title: '',
  excerpt: '',
  content: '',
  tags: '',
  aiGenerated: false,
  imageUrl: '',
  imagePublicId: '',
};

export default function Admin() {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);

  const loadBlogs = async () => {
    setLoading(true);
    try {
      const data = await getAllBlogs();
      setBlogs(data);
    } catch (err) {
      toast.error('Could not load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setImageFile(null);
    setImagePreview('');
  };

  const handleAIGenerated = (data) => {
    setForm((f) => ({
      ...f,
      title: data.title,
      excerpt: data.excerpt,
      content: data.content,
      aiGenerated: true,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleEdit = (blog) => {
    setEditingId(blog.id);
    setForm({
      title: blog.title || '',
      excerpt: blog.excerpt || '',
      content: blog.content || '',
      tags: (blog.tags || []).join(', '),
      aiGenerated: !!blog.aiGenerated,
      imageUrl: blog.imageUrl || '',
      imagePublicId: blog.imagePublicId || '',
    });
    setImagePreview(blog.imageUrl || '');
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, imagePublicId) => {
    if (!confirm('Delete this post permanently?')) return;
    try {
      await deleteBlog(id);
      if (imagePublicId) await deleteBlogImage(imagePublicId);
      setBlogs((prev) => prev.filter((b) => b.id !== id));
      toast.success('Post deleted');
    } catch (err) {
      toast.error('Could not delete post');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setSaving(true);
    try {
      let imageUrl = form.imageUrl;
      let imagePublicId = form.imagePublicId;

      if (imageFile) {
        const slug = form.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
        // Replacing an existing image on edit — clean up the old one after
        // the new upload succeeds, so we never end up with neither.
        const oldPublicId = editingId ? form.imagePublicId : null;
        const { url, publicId } = await uploadBlogImage(imageFile, slug);
        imageUrl = url;
        imagePublicId = publicId;
        if (oldPublicId) await deleteBlogImage(oldPublicId);
      }

      const payload = {
        title: form.title.trim(),
        excerpt: form.excerpt.trim(),
        content: form.content.trim(),
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        aiGenerated: form.aiGenerated,
        imageUrl: imageUrl || null,
        imagePublicId: imagePublicId || null,
        authorName: user?.displayName || 'Admin',
      };

      if (editingId) {
        await updateBlog(editingId, payload);
        toast.success('Post updated');
      } else {
        await createBlog(payload);
        toast.success('Post published');
      }

      resetForm();
      loadBlogs();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-5 md:px-8 py-12">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <h1 className="font-display text-3xl font-semibold">Admin</h1>
        <p className="text-sm text-parchment/50">Signed in as {user?.displayName}</p>
      </div>

      <AIGeneratePanel onGenerated={handleAIGenerated} />

      <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 mt-6 space-y-4">
        <h2 className="font-display text-xl font-semibold mb-1">
          {editingId ? 'Edit post' : 'New post'}
        </h2>

        <div>
          <label className="text-sm text-parchment/60 block mb-1.5">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="input-field"
            placeholder="Post title"
          />
        </div>

        <div>
          <label className="text-sm text-parchment/60 block mb-1.5">Excerpt</label>
          <input
            type="text"
            value={form.excerpt}
            onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
            className="input-field"
            placeholder="Short teaser shown on the homepage"
          />
        </div>

        <div>
          <label className="text-sm text-parchment/60 block mb-1.5">
            Content (markdown: ## heading, **bold**, - list, &gt; quote)
          </label>
          <textarea
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            rows={10}
            className="input-field resize-y font-mono text-sm"
            placeholder="Write or generate the post body…"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-parchment/60 block mb-1.5">Tags (comma separated)</label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              className="input-field"
              placeholder="react, webdev, tutorial"
            />
          </div>

          <div>
            <label className="text-sm text-parchment/60 block mb-1.5">Featured image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-parchment/60 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-signal/20 file:text-signal file:cursor-pointer"
            />
          </div>
        </div>

        {imagePreview && (
          <img src={imagePreview} alt="Preview" className="rounded-xl max-h-48 object-cover" />
        )}

        <label className="flex items-center gap-2 text-sm text-parchment/60">
          <input
            type="checkbox"
            checked={form.aiGenerated}
            onChange={(e) => setForm((f) => ({ ...f, aiGenerated: e.target.checked }))}
            className="accent-clay"
          />
          Mark as AI-assisted
        </label>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-signal">
            {saving ? 'Saving…' : editingId ? 'Update post' : 'Publish post'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="btn-ghost">
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <div className="mt-12">
        <h2 className="font-display text-xl font-semibold mb-4">
          All posts {!loading && `(${blogs.length})`}
        </h2>

        {loading ? (
          <p className="text-parchment/50">Loading…</p>
        ) : (
          <ul className="space-y-3">
            {blogs.map((blog) => (
              <li
                key={blog.id}
                className="glass rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">
                    {blog.aiGenerated && <span className="text-clay mr-1.5">●</span>}
                    {blog.title}
                  </p>
                  <p className="text-xs text-parchment/40">{blog.likes || 0} likes</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleEdit(blog)} className="btn-ghost !py-1.5 !px-4 text-sm">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(blog.id, blog.imagePublicId)}
                    className="!py-1.5 !px-4 text-sm rounded-full border border-clay/40 text-clay-bright hover:bg-clay/10 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
