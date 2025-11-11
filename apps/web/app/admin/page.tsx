'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Card, Input, Textarea } from '../components/ui';
import { Users, Briefcase, Database, Lock } from 'lucide-react';

const API = 'http://127.0.0.1:8000';

export default function AdminPage() {
  const [apiKey, setApiKey] = useState('');
  const [form, setForm] = useState({
    title: 'Product Designer',
    company: 'Google',
    role: 'UI/UX Designer',
    jd_text:
      'Design user-centric experiences using Figma, wireframes, prototyping, usability testing, and design systems.',
    must_have: 'figma, wireframes, prototyping, usability testing, design systems',
    nice_to_have: 'user research, stakeholder interviews, component libraries',
    min_exp_years: 2,
    location: 'Bengaluru',
  });

  const [jobs, setJobs] = useState<any[]>([]);
  const [users, setUsers] = useState<{ email: string; candidate_id: string }[]>([]);
  const [toast, setToast] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Load saved admin key
  useEffect(() => {
    const saved = localStorage.getItem('ADMIN_API_KEY');
    if (saved) setApiKey(saved);
  }, []);

  function saveKey() {
    localStorage.setItem('ADMIN_API_KEY', apiKey);
    setToast('✅ Admin key saved in this browser.');
    setTimeout(() => setToast(''), 2500);
  }

  async function createJob() {
    if (!apiKey) {
      setToast('⚠️ Enter Admin API Key first!');
      return;
    }

    const payload = {
      title: form.title,
      company: form.company,
      role: form.role,
      jd_text: form.jd_text,
      must_have: form.must_have.split(',').map((s) => s.trim()).filter(Boolean),
      nice_to_have: form.nice_to_have.split(',').map((s) => s.trim()).filter(Boolean),
      min_exp_years: Number(form.min_exp_years),
      location: form.location,
    };

    const r = await fetch(API + '/admin/job/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    const d = await r.json();
    if (!r.ok) {
      setToast(d.detail || '❌ Job creation failed.');
      return;
    }

    setToast('✅ Job created successfully: ' + d.job_id);
    loadJobs();
  }

  async function loadJobs() {
    const r = await fetch(API + '/jobs');
    const d = await r.json();
    setJobs(d);
  }

  // 🧾 Load all users (requires valid admin key)
  async function loadUsers() {
    if (!apiKey) {
      setToast('⚠️ Enter Admin API Key to load users.');
      return;
    }
    setLoadingUsers(true);
    try {
      const r = await fetch(`${API}/admin/users?admin_key=${apiKey}`);
      const d = await r.json();
      if (!r.ok) {
        setToast('❌ Invalid Admin Key or Unauthorized.');
        setLoadingUsers(false);
        return;
      }
      setUsers(d.users);
      setToast(`✅ Loaded ${d.total_users} users.`);
    } catch {
      setToast('⚠️ Unable to fetch users. Is the backend running?');
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-8 space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {toast && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 shadow-sm">
          {toast}
        </div>
      )}

      {/* 🔐 Admin Access Key */}
      <Card className="p-6 shadow-lg border border-indigo-100 bg-white/90">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl font-bold text-indigo-700">Admin Access Control</h1>
        </div>
        <div className="flex gap-2 mb-3">
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter Admin API Key"
          />
          <Button variant="secondary" onClick={saveKey}>
            Remember
          </Button>
        </div>
        <div className="flex gap-3">
          <Button onClick={loadUsers} disabled={loadingUsers}>
            {loadingUsers ? 'Loading...' : 'Load Registered Users'}
          </Button>
          <Button variant="secondary" onClick={loadJobs}>
            Refresh Jobs
          </Button>
        </div>
      </Card>

      {/* 🧑‍💼 Registered Users Section */}
      <Card className="p-6 shadow-lg border border-indigo-100 bg-white/90">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-6 h-6 text-indigo-600" />
          <h2 className="text-lg font-bold text-indigo-700">
            Registered Users ({users.length})
          </h2>
        </div>
        {users.length === 0 ? (
          <p className="text-gray-500">No registered users yet. Click "Load Registered Users".</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-indigo-100">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Candidate ID</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr
                    key={idx}
                    className="border-t hover:bg-indigo-50 transition-colors"
                  >
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2 font-mono text-indigo-700">
                      {u.candidate_id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 💼 Job Management Section */}
      <Card className="p-6 shadow-lg border border-indigo-100 bg-white/90">
        <div className="flex items-center gap-3 mb-4">
          <Briefcase className="w-6 h-6 text-indigo-600" />
          <h2 className="text-lg font-bold text-indigo-700">Job Management</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1">Company</label>
            <Input
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Role</label>
            <Input
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Title</label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-semibold mb-1">Job Description</label>
            <Textarea
              value={form.jd_text}
              onChange={(e) => setForm({ ...form, jd_text: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              Must-have (comma separated)
            </label>
            <Input
              value={form.must_have}
              onChange={(e) => setForm({ ...form, must_have: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              Nice-to-have (comma separated)
            </label>
            <Input
              value={form.nice_to_have}
              onChange={(e) => setForm({ ...form, nice_to_have: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Min Exp (years)</label>
            <Input
              type="number"
              value={form.min_exp_years}
              onChange={(e) =>
                setForm({ ...form, min_exp_years: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Location</label>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <Button onClick={createJob}>Create Job (Admin Only)</Button>
        </div>
      </Card>

      {/* 🗂 Existing Jobs List */}
      <Card className="p-6 shadow-lg border border-indigo-100 bg-white/90">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-indigo-700">
              Existing Jobs ({jobs.length})
            </h2>
          </div>
        </div>

        {jobs.length === 0 ? (
          <p className="text-gray-500">No jobs available yet.</p>
        ) : (
          <div className="space-y-2">
            {jobs.map((j: any) => (
              <div
                key={j.job_id}
                className="p-3 border rounded-xl flex items-center justify-between hover:bg-indigo-50 transition-all"
              >
                <div>
                  <div className="font-semibold text-indigo-700">
                    {j.company} • {j.role}
                  </div>
                  <div className="text-xs text-gray-500">{j.title}</div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(j.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
