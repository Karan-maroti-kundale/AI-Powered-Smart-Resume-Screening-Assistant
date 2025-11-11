'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Smartphone, ArrowRight, X, Upload } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { Dialog } from '@headlessui/react';

export default function CreateResume() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 🧠 Form state
  const [f, setF] = useState({
    name: '',
    email: '',
    phone: '',
    senderNumber: '',
    role: '',
    skills: '',
    projects: '',
    achievements: '',
    paymentProof: null as File | null,
  });

  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrValue, setQrValue] = useState('');

  // 🔒 Redirect unauthenticated users
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (session) {
      setF((prev) => ({
        ...prev,
        name: session.user?.name || '',
        email: session.user?.email || '',
      }));
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return <div className="text-center mt-10 text-gray-600">Loading...</div>;
  }
  if (!session) return null;

  // ✅ Detect mobile devices
  const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // ---------------- SUBMIT HANDLERS ----------------
  async function sendDetails() {
    setLoading(true);
    try {
      const formData = new FormData();
      for (const key in f) {
        if (key !== 'paymentProof' && f[key]) formData.append(key, f[key]);
      }
      if (f.paymentProof) {
        formData.append('paymentProof', f.paymentProof);
      }

      const res = await fetch('http://127.0.0.1:8000/api/save', {
        method: 'POST',
        body: formData,
      });

      const j = await res.json();
      setStatusMsg(
        j.ok
          ? '✅ Details sent successfully! You’ll receive your resume within 3–4 days.'
          : '⚠️ Error sending details.'
      );
    } catch (err) {
      console.error(err);
      setStatusMsg('⚠️ Failed to contact server.');
    } finally {
      setLoading(false);
    }
  }

function payAndSubmit() {
  if (!f.senderNumber || f.senderNumber.length < 10) {
    alert('⚠️ Please enter your UPI-linked mobile number before proceeding.');
    return;
  }

  const upi = `upi://pay?pa=8010407897@yapl&pn=AI%20Resume%20Builder&am=199&cu=INR&tn=Resume%20Creation%20Payment%20(${f.senderNumber})`;

  if (isMobile()) {
    // 🟢 Mobile → open UPI app
    window.location.href = upi;

    setTimeout(() => {
      const confirmPaid = confirm(
        '✅ Have you completed the ₹199 payment in your UPI app (GPay / PhonePe / Paytm)?\n\nClick "OK" only if the payment was successful.'
      );

      if (confirmPaid) {
        sendDetails();
        alert(
          '🎉 Thank you! Payment confirmation received. Your resume will be delivered to your email within 3–4 days.'
        );
      } else {
        alert('⚠️ Payment not confirmed. Please complete payment first.');
      }
    }, 6000);
  } else {
    // 💻 Desktop → show QR code modal
    setQrValue(upi);
    setShowQR(true);
  }
}

// ✅ Confirm button for QR modal (desktop)
function handleQRConfirm() {
  const confirmPaid = confirm(
    '✅ Have you successfully paid ₹199 via UPI (GPay / PhonePe / Paytm)?\n\nClick "OK" only if the payment was successful.'
  );

  if (confirmPaid) {
    setShowQR(false);
    sendDetails();
    alert(
      '🎉 Thank you! We’ll verify your payment and send your resume within 3–4 days.'
    );
  } else {
    alert('⚠️ Payment not confirmed. Please complete payment first.');
  }
}


  // ---------------- UI ----------------
  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-100 flex flex-col items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full border border-emerald-200"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-center text-emerald-700 mb-2">
          🌿 Create Your AI-Powered Resume
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Fill in your details → Pay ₹199 via UPI → Upload your payment proof (optional) → Receive your resume in 3–4 days.
        </p>

        {['name', 'email', 'phone', 'role'].map((k) => (
          <input
            key={k}
            placeholder={k.toUpperCase()}
            className="w-full border border-gray-300 p-3 mb-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            value={(f as any)[k]}
            onChange={(e) => setF({ ...f, [k]: e.target.value })}
          />
        ))}

        {/* UPI Linked Number */}
        <div className="relative mb-3">
          <Smartphone className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
          <input
            placeholder="UPI linked Mobile Number (required)"
            className="w-full border border-gray-300 pl-10 p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            value={f.senderNumber}
            onChange={(e) => setF({ ...f, senderNumber: e.target.value })}
          />
        </div>

        {/* Textareas */}
        {['skills', 'projects', 'achievements'].map((k) => (
          <textarea
            key={k}
            placeholder={k.toUpperCase()}
            className="w-full border border-gray-300 p-3 mb-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            rows={3}
            value={(f as any)[k]}
            onChange={(e) => setF({ ...f, [k]: e.target.value })}
          />
        ))}

        {/* 🧾 Payment Proof Upload */}
        <label className="block mb-3">
          <span className="text-gray-700 font-medium flex items-center gap-2">
            <Upload className="w-4 h-4" /> Upload Payment Proof (optional)
          </span>
          <input
            type="file"
            accept="image/*"
            className="w-full mt-2 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            onChange={(e) =>
              setF({ ...f, paymentProof: e.target.files?.[0] || null })
            }
          />
        </label>

        {/* 💳 Payment Section */}
        <div className="text-center mb-3 font-semibold text-gray-700">
          Pay securely using your favorite UPI app
        </div>

        <div className="flex justify-center gap-10 mb-5 items-center bg-white/60 rounded-xl shadow-md p-4">
          {/* Google Pay */}
          <motion.a
            whileHover={{ scale: 1.1 }}
            href="https://payments.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center text-gray-600 hover:text-green-700 transition"
          >
            <img
              src="/gpay.png"
              alt="Google Pay"
              className="h-12 w-12 object-contain mb-1"
            />
            <span className="text-xs font-medium">GPay</span>
          </motion.a>

          {/* PhonePe */}
          <motion.a
            whileHover={{ scale: 1.1 }}
            href="https://www.phonepe.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center text-gray-600 hover:text-purple-700 transition"
          >
            <img
              src="/phonepe.png"
              alt="PhonePe"
              className="h-12 w-12 object-contain mb-1"
            />
            <span className="text-xs font-medium">PhonePe</span>
          </motion.a>

          {/* Paytm */}
          <motion.a
            whileHover={{ scale: 1.1 }}
            href="https://paytm.com/download-paytm-app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center text-gray-600 hover:text-blue-700 transition"
          >
            <img
              src="/paytm.png"
              alt="Paytm"
              className="h-12 w-12 object-contain mb-1"
            />
            <span className="text-xs font-medium">Paytm</span>
          </motion.a>
        </div>

        <button
          onClick={payAndSubmit}
          disabled={loading}
          className={`w-full py-3 rounded-lg text-white text-lg font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-600 to-emerald-500 hover:scale-105'
          }`}
        >
          {loading ? 'Processing...' : '💳 Pay ₹199 via UPI'}
          {!loading && <ArrowRight className="w-5 h-5" />}
        </button>

        {statusMsg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 text-green-600 font-semibold mt-4"
          >
            <CheckCircle2 className="w-5 h-5" /> {statusMsg}
          </motion.div>
        )}
      </motion.div>

      {/* 🧾 QR Code Modal for Desktop */}
      <Dialog open={showQR} onClose={() => setShowQR(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center relative"
          >
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setShowQR(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <Dialog.Title className="text-lg font-semibold mb-3 text-gray-700">
              Scan & Pay ₹199
            </Dialog.Title>
            <p className="text-sm text-gray-500 mb-4">
              Open your UPI app (GPay / PhonePe / Paytm) and scan this QR to pay ₹199 securely.
            </p>

            <div className="flex justify-center mb-4">
              <QRCodeCanvas value={qrValue} size={180} />
            </div>

            <button
              onClick={handleQRConfirm}
              className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              ✅ I’ve Completed Payment
            </button>
          </motion.div>
        </div>
      </Dialog>
    </motion.div>
  );
}
