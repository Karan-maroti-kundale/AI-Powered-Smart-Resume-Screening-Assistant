'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [status, setStatus] = useState('');

  async function registerUser(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setStatus('✅ Account created! Redirecting...');
      setTimeout(() => router.push('/login'), 2000);
    } else {
      setStatus(`⚠️ ${data.error}`);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md"
      >
        <h1 className="text-3xl font-bold text-emerald-700 text-center mb-6">
          Create Account 🌸
        </h1>
        <form onSubmit={registerUser} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            required
            className="w-full border border-emerald-200 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            required
            className="w-full border border-emerald-200 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            required
            className="w-full border border-emerald-200 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button
            type="submit"
            className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
          >
            Register
          </button>
        </form>
        {status && (
          <div className="mt-4 text-center text-sm text-gray-600">{status}</div>
        )}
      </motion.div>
    </div>
  );
}
