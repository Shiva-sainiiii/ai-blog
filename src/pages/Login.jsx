import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { user, isAdmin, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && isAdmin) navigate('/admin');
  }, [user, isAdmin, navigate]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (err) {
      console.error(err);
      toast.error('Sign-in failed. Try again.');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="glass-strong rounded-2xl p-10 max-w-sm w-full text-center">
        <p className="font-display text-3xl mb-2">Admin sign-in</p>
        <p className="text-parchment/60 text-sm mb-8">
          Sign in with the Google account approved for this blog's admin panel.
        </p>
        <button onClick={handleLogin} className="btn-signal w-full">
          Continue with Google
        </button>
      </div>
    </div>
  );
}
