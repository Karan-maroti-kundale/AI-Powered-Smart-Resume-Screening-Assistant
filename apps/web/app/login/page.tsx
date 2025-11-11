'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { FaGoogle, FaLeaf } from 'react-icons/fa';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
      callbackUrl: '/',
    });

    if (res?.error) {
      setError('Invalid email or password.');
      setLoading(false);
    } else {
      window.location.href = '/';
    }
  }

  async function handleGoogleLogin() {
    await signIn('google', { callbackUrl: '/' });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 relative overflow-hidden">
      {/* Floating leaves animation */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: [0, 15, 0], opacity: 1 }}
        transition={{ repeat: Infinity, duration: 4 }}
        className="absolute top-10 left-20 text-emerald-400 text-4xl opacity-50"
      >
        <FaLeaf />
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: [0, -15, 0], opacity: 1 }}
        transition={{ repeat: Infinity, duration: 5 }}
        className="absolute bottom-20 right-32 text-green-400 text-3xl opacity-40"
      >
        <FaLeaf />
      </motion.div>

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="bg-white/80 backdrop-blur-lg p-10 rounded-3xl shadow-2xl max-w-md w-full border border-emerald-100"
      >
        <div className="text-center mb-8">
          <motion.h1
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-extrabold text-emerald-700"
          >
            Welcome Back 🌿
          </motion.h1>
          <p className="text-gray-600 text-sm mt-2">
            Login to your account to access the AI Resume System
          </p>
        </div>

        {/* ✅ Email/Password Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-emerald-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-4 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-emerald-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 px-4 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              placeholder="••••••••"
            />
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* ✅ Only Google login (LinkedIn + Facebook removed) */}
        <div className="mt-6 text-center text-gray-500 text-sm">or continue with</div>
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={handleGoogleLogin}
            className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg"
          >
            <FaGoogle />
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          Don’t have an account?{' '}
          <a href="/register" className="text-emerald-600 font-semibold hover:underline">
            Create one
          </a>
        </div>
      </motion.div>
    </div>
  );
}
