import "./globals.css";
import Providers from "./providers";
import NavBar from "./components/NavBar";
import ChatBot from "./components/ChatBot";

export const metadata = {
  title: "⚡ ATS-Grade Resume Screening — Semantic v3",
  description: "AI-Powered Resume Screening and Creation Tool",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-green-50 text-gray-900">
        {/* 🌿 App-wide Providers (NextAuth, Theme, etc.) */}
        <Providers>
          {/* 🌼 Navbar */}
          <NavBar />

          {/* 📄 Main Content */}
          <main className="max-w-6xl mx-auto px-5 py-8">{children}</main>

          {/* 🌸 Footer */}
          <footer className="mt-10 border-t border-gray-200 text-center py-4 text-gray-500 text-sm">
            © {new Date().getFullYear()} AI Resume Screening • Crafted with ❤️ by{" "}
            <b>Karan Kundale</b>
          </footer>
        </Providers>

        {/* 💬 Floating Chat Assistant — stays fixed across all pages */}
        <ChatBot />
      </body>
    </html>
  );
}
