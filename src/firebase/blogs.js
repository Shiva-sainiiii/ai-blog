import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
  serverTimestamp,
  increment,
  limit as fsLimit,
} from 'firebase/firestore';
import { db } from './config';

const blogsCol = collection(db, 'blogs');

export async function getAllBlogs({ pageLimit } = {}) {
  const constraints = [orderBy('createdAt', 'desc')];
  if (pageLimit) constraints.push(fsLimit(pageLimit));
  const q = query(blogsCol, ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getBlogById(id) {
  const ref = doc(db, 'blogs', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getBlogsByTag(tag) {
  const q = query(blogsCol, where('tags', 'array-contains', tag), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createBlog(blog) {
  const payload = {
    title: blog.title,
    excerpt: blog.excerpt,
    content: blog.content,
    imageUrl: blog.imageUrl || null,
    imagePublicId: blog.imagePublicId || null,
    tags: blog.tags || [],
    aiGenerated: !!blog.aiGenerated,
    likes: 0,
    likedBy: [],
    authorName: blog.authorName || 'Admin',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(blogsCol, payload);
  return ref.id;
}

export async function updateBlog(id, updates) {
  const ref = doc(db, 'blogs', id);
  await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
}

export async function deleteBlog(id) {
  const ref = doc(db, 'blogs', id);
  await deleteDoc(ref);
}

export async function toggleLike(blogId, userId, currentlyLiked) {
  const ref = doc(db, 'blogs', blogId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const likedBy = new Set(data.likedBy || []);

  if (currentlyLiked) {
    likedBy.delete(userId);
  } else {
    likedBy.add(userId);
  }

  await updateDoc(ref, {
    likedBy: Array.from(likedBy),
    likes: increment(currentlyLiked ? -1 : 1),
  });
}

// ---- Comments (subcollection: blogs/{id}/comments) ----

export async function getComments(blogId) {
  const col = collection(db, 'blogs', blogId, 'comments');
  const q = query(col, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addComment(blogId, { text, authorName, authorId, authorPhoto }) {
  const col = collection(db, 'blogs', blogId, 'comments');
  await addDoc(col, {
    text,
    authorName,
    authorId,
    authorPhoto: authorPhoto || null,
    createdAt: serverTimestamp(),
  });
}

export async function deleteComment(blogId, commentId) {
  const ref = doc(db, 'blogs', blogId, 'comments', commentId);
  await deleteDoc(ref);
}
