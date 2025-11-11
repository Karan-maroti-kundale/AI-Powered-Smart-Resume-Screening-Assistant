"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { FaLeaf } from "react-icons/fa";

export default function NavBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const isActive = (path: string) =>
    pathname === path
      ? "text-emerald-700 font-semibold"
      : "text-gray-700 hover:text-emerald-600 transition-colors duration-200";

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-emerald-100 shadow-sm"
    >
      <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
        {/* 🌿 Logo Section */}
        <Link
          href="/"
          className="flex items-center gap-2 text-emerald-700 hover:text-emerald-800 transition-all duration-200"
        >
          <FaLeaf className="text-emerald-500 text-xl" />
          <span className="text-xl font-extrabold tracking-tight">
            AI Resume Builder
          </span>
        </Link>

        {/* 🌼 Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className={isActive("/")}>
            Home
          </Link>
          <Link href="/create-resume" className={isActive("/create-resume")}>
            Create Resume
          </Link>
          <Link href="/admin" className={isActive("/admin")}>
            Admin
          </Link>

          {/* 🔒 Auth Buttons */}
          {!session ? (
            <button
              onClick={() => router.push("/login")}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-green-500 text-white hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Login
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 font-medium">
                Hi, {session.user?.name || session.user?.email?.split("@")[0]}
              </span>
              <button
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  await signOut({ callbackUrl: "/" });
                }}
                className={`px-4 py-2 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-all ${
                  busy ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {busy ? "…" : "Logout"}
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* 📱 Mobile Menu */}
      <div className="md:hidden flex justify-center py-3 border-t border-emerald-100 bg-white/70">
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link href="/" className={isActive("/")}>
            Home
          </Link>
          <Link href="/create-resume" className={isActive("/create-resume")}>
            Resume
          </Link>
          {!session ? (
            <button
              onClick={() => router.push("/login")}
              className="bg-emerald-600 text-white px-3 py-1 rounded-md text-sm"
            >
              Login
            </button>
          ) : (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-emerald-600 font-semibold"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
