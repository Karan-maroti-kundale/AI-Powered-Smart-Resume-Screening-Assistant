'use client';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Card, Input, Select, Badge, Progress } from './components/ui';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useRef } from 'react';


const API = 'http://127.0.0.1:8000';

type Job = {
  job_id: string;
  title: string;
  company: string;
  role: string;
  location: string | null;
  created_at: string;
};
type Ranking = {
  candidate_id: string;
  score: number;
  analysis: any;
  created_at: string;
};

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobId, setJobId] = useState('');
  const [candidateId, setCandidateId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [toast, setToast] = useState('');

  // ✅ Fetch jobs
  // ✅ Fetch jobs
  async function loadJobs() {
    try {
      const r = await fetch(API + '/jobs');
      const data = await r.json();

      if (Array.isArray(data)) {
        setJobs(data);
        if (data.length && !jobId) setJobId(data[0].job_id);
      } else if (Array.isArray(data.jobs)) {
        // sometimes backend wraps response like { jobs: [...] }
        setJobs(data.jobs);
        if (data.jobs.length && !jobId) setJobId(data.jobs[0].job_id);
      } else {
        console.warn("⚠️ Unexpected jobs response:", data);
        setJobs([]);
      }
    } catch (err) {
      console.error("Failed to load jobs:", err);
      setJobs([]);
      setToast("⚠️ Failed to load jobs.");
    }
  }


  // ✅ Generate or fetch Candidate ID
  async function fetchCandidateId(email: string) {
    try {
      const res = await fetch(API + '/generate_candidate_id', {
        method: 'POST',
        body: new URLSearchParams({ email }),
      });
      const data = await res.json();
      if (data.ok) {
        setCandidateId(data.candidate_id);
        setToast('✅ Candidate ID loaded successfully!');
        setTimeout(() => setToast(''), 3000);
      } else {
        setToast('⚠️ Failed to fetch candidate ID.');
      }
    } catch {
      setToast('⚠️ Unable to connect to backend.');
    }
  }

  // ✅ Upload and analyze resume
  async function uploadAndAnalyze() {
    if (!jobId || !file) {
      setToast('⚠️ Select a job and upload a resume first.');
      return;
    }
    if (!candidateId || candidateId.length !== 6 || !/^\d+$/.test(candidateId)) {
      setToast('⚠️ Add correct 6-digit Candidate ID before analyzing.');
      return;
    }

    setLoading(true);
    const form = new FormData();
    form.append('candidate_id', candidateId);
    form.append('job_id', jobId);
    form.append('file', file);

    try {
      const r = await fetch(API + '/resume/upload_file', { method: 'POST', body: form });
      const d = await r.json();

      if (!r.ok) {
        setToast(d.detail || '❌ Upload failed. Check Candidate ID.');
        setLoading(false);
        return;
      }

      await fetchRankings();
      setToast('✅ Resume analyzed successfully!');
    } catch {
      setToast('⚠️ Network error while analyzing.');
    } finally {
      setLoading(false);
      setTimeout(() => setToast(''), 3000);
    }
  }

  // ✅ Fetch leaderboard (only for current logged-in candidate)
  async function fetchRankings() {
    if (!jobId || !candidateId) return;
    try {
      const r = await fetch(`${API}/rankings/${jobId}?candidate_id=${candidateId}`);
      if (!r.ok) return;
      const d = await r.json();
      setRankings(Array.isArray(d) ? d : []);
    } catch (err) {
      console.error('Error fetching user rankings:', err);
    }
  }

  // ✅ Only run candidate ID fetch once per login
  const sentRef = useRef(false);

  useEffect(() => {
    if (status === 'loading') return; // 🧠 Wait until session is ready

    if (status === 'authenticated' && session?.user?.email && !sentRef.current) {
      sentRef.current = true;
      fetchCandidateId(session.user.email);
    } else if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, session]);

  // ✅ Load jobs when page mounts
  useEffect(() => {
    loadJobs();
  }, []);

  const top = useMemo(() => (Array.isArray(rankings) ? rankings.slice(0, 8) : []), [rankings]);
  const latest = top[0]?.analysis;

  const radarData = latest
    ? [
      { metric: 'Must', value: Math.round(latest.components.must_cov * 100) },
      { metric: 'Similarity', value: Math.round(latest.components.similarity * 100) },
      { metric: 'Fuzzy', value: Math.round(latest.components.fuzzy * 100) },
      { metric: 'Experience', value: Math.round(latest.components.experience * 100) },
      { metric: 'Weighted', value: Math.round(latest.components.weighted * 100) },
    ]
    : [];

  // ✅ Handle session loading (fixes white screen issue)
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-indigo-700 font-semibold gap-2 animate-pulse">
        ⏳ Loading your dashboard...
        <span className="text-sm text-gray-500">Please wait while we set things up...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      {/* 🚫 Removed 'AI Resume Screening' header — main navbar already exists */}

      {/* Main Page Content */}
      <motion.div
        className="container mx-auto px-6 py-10 space-y-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {toast && (
          <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-sm">
            {toast}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload Form */}
          <Card className="p-6 bg-white/90 backdrop-blur-md shadow-lg border border-indigo-100">
            <h2 className="font-extrabold text-lg mb-3 text-indigo-700">📂 Select Job & Upload Resume</h2>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold mb-1 text-indigo-600">
                  Job
                </label>

                <Select value={jobId} onChange={(e: any) => setJobId(e.target.value)}>
                  <option value="">-- choose --</option>

                  {/* ✅ Safe handling for all cases */}
                  {!Array.isArray(jobs) || jobs.length === 0 ? (
                    <option disabled>Loading jobs...</option>
                  ) : (
                    jobs.map((j) => (
                      <option key={j.job_id} value={j.job_id}>
                        {j.company} • {j.role} ({j.location || "N/A"})
                      </option>
                    ))
                  )}
                </Select>
              </div>


              <div>
                <label className="block text-sm font-semibold mb-1 text-indigo-600">Candidate ID</label>
                <Input
                  value={candidateId}
                  placeholder="6-digit ID"
                  className={`border-2 ${candidateId.length === 6 ? 'border-green-400' : 'border-red-300'}`}
                  readOnly
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-1 text-indigo-600">
                  Resume (.pdf / .docx)
                </label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="input border border-gray-300 rounded-lg p-2 w-full"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <Button onClick={uploadAndAnalyze} loading={loading} disabled={!jobId || loading}>
                Analyze Resume
              </Button>
              <Button variant="secondary" onClick={fetchRankings}>
                Refresh
              </Button>
            </div>
          </Card>

          {/* Score Display */}
          <Card className="p-6 bg-white/90 border border-indigo-100 shadow-lg">
            <h2 className="font-extrabold text-lg mb-3 text-indigo-700">🎯 Latest Candidate Score</h2>
            {!latest && <div className="text-gray-500">No results yet. Upload a resume.</div>}
            {latest && (
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-extrabold text-indigo-700">{Math.round(latest.accuracy)}%</div>
                  <div className="w-2/3">
                    <Progress value={latest.accuracy} />
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis />
                      <Radar dataKey="value" name="Score" fill="#6366f1" fillOpacity={0.6} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* 🏆 Leaderboard Section */}
        <Card className="p-6 bg-white/90 border border-indigo-100 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-lg text-indigo-700">🏆 Leaderboard</h2>
            <Badge>{top.length} result(s)</Badge>
          </div>

          <div className="grid md:grid-cols-1 gap-3">
            {top.map((r, idx) => {
              // 🕒 Convert UTC to IST manually (+5 hours 30 minutes)
              const formattedDate = r.created_at
                ? new Date(new Date(r.created_at).getTime() + (5.5 * 60 * 60 * 1000)).toLocaleString('en-IN', {
                  dateStyle: 'short',
                  timeStyle: 'medium',
                })
                : '—';


              return (
                <motion.div
                  key={r.candidate_id + idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl border border-gray-200 bg-white space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800">{r.candidate_id}</div>
                        <div className="text-xs text-gray-500 italic">Bucket: {r.analysis.bucket}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-extrabold text-indigo-700">
                        {Math.round(r.analysis.accuracy)}%
                      </div>
                      {/* 🕒 Show real-time formatted date */}
                      <div className="text-xs text-gray-500 mt-1">{formattedDate}</div>
                    </div>
                  </div>

                  {/* 🧠 Skill Breakdown */}
                  {r.analysis?.components && (
                    <div className="text-sm text-gray-600 grid md:grid-cols-2 gap-3 mt-3">
                      <div>
                        <p className="font-semibold text-indigo-600">✅ Must-have Coverage:</p>
                        <p>{Math.round(r.analysis.components.must_cov * 100)}%</p>
                      </div>
                      <div>
                        <p className="font-semibold text-indigo-600">⭐ Nice-to-have (Fuzzy Match):</p>
                        <p>{Math.round(r.analysis.components.fuzzy * 100)}%</p>
                      </div>
                      <div>
                        <p className="font-semibold text-indigo-600">🧩 Skill Similarity:</p>
                        <p>{Math.round(r.analysis.components.similarity * 100)}%</p>
                      </div>
                      <div>
                        <p className="font-semibold text-indigo-600">🎓 Experience Match:</p>
                        <p>{Math.round(r.analysis.components.experience * 100)}%</p>
                      </div>
                    </div>
                  )}

                  {/* 🧰 Detected Skills */}
                  {r.analysis?.skills && (
                    <div className="mt-3">
                      <p className="font-semibold text-indigo-600 mb-1">🛠️ Detected Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {r.analysis.skills.map((skill: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded-full text-xs bg-indigo-50 text-indigo-700 border border-indigo-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}

            {top.length === 0 && (
              <div className="text-center text-gray-500 italic">No analyzed resumes yet.</div>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
