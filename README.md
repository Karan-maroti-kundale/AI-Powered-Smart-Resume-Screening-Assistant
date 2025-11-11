# ⚡ AI-Powered Resume Screening & Assistant (with Ollama LLaMA 3.2)

An **AI-driven resume analysis and job screening platform** built using **FastAPI**, **Next.js**, and **Ollama (LLaMA 3.2)**.  
It automatically analyzes resumes, matches them to job descriptions, generates AI-based scores, and includes a **real-time AI assistant chatbot** — all running locally and cost-free.

---

## 🚀 Features

✅ Resume upload & parsing (.PDF / .DOCX)  
✅ AI-based skill, experience & similarity scoring  
✅ Leaderboard ranking for candidates  
✅ Real-time AI Assistant powered by **Ollama (LLaMA 3.2)**  
✅ Automatic Candidate ID generation & email delivery  
✅ Secure admin access (API key protected)  
✅ Optional UPI payment integration  
✅ Frontend: Next.js + Tailwind CSS  
✅ Backend: FastAPI + SQLite  
✅ 100% local, privacy-first AI — no external APIs required  

---

## 🧩 Tech Stack

**Frontend:** Next.js, React, Tailwind CSS  
**Backend:** FastAPI (Python), SQLite  
**AI Model:** Ollama LLaMA 3.2  
**Email Service:** Gmail SMTP  
**Payment (Optional):** UPI integration  
**Machine Learning:** TF-IDF, Fuzzy Matching, Sentence Transformers  

## ⚙️ Local Setup

### 1️⃣ Clone the repository

git clone https://github.com/<your-username>/AI-Powered-Resume-Screening.git
cd AI-Powered-Resume-Screening

### 2️⃣ Backend Setup (FastAPI)

Copy code
cd api
python -m venv venv
venv\Scripts\activate      # for Windows
pip install -r requirements.txt
uvicorn app:app --reload

### 3️⃣ Frontend Setup (Next.js)

Copy code
cd apps/web
npm install
npm run dev

### 4️⃣ Start Ollama Server (LLaMA 3.2)

Copy code
ollama serve
ollama pull llama3.2

🧑‍💻 Project Structure
AI-Powered-Resume-Screening/
│
├── api/                  # FastAPI backend
│   ├── app.py            # Main backend logic
│   ├── payment_api.py    # (Optional) UPI payment integration
│   ├── db/               # SQLite database + schema.sql
│
├── apps/
│   └── web/              # Next.js frontend
│       ├── components/   # ChatBot, UI components
│       ├── app/          # Next.js pages
│
├── venv/                 # Python virtual environment
├── start_project.bat     # Auto startup script (Windows)
├── requirements.txt      # Backend dependencies

🧠 AI Assistant

Your local AI assistant helps users:
Answer resume & interview-related queries
Guide on career tips or profile improvements
Runs 100% locally via Ollama — no API costs or data leaks

Crafted with ❤️ by Karan Kundale,thank you...
