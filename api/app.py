import os
import io
import re
import json
import uuid
import pathlib
import datetime as dt
import sqlite3
import random
import smtplib
import requests

from typing import Optional, List, Dict, Any
from fastapi import FastAPI, UploadFile, Form, File, HTTPException, Depends, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from pdfminer.high_level import extract_text as pdf_extract_text
from docx import Document
from rapidfuzz import fuzz
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from email.mime.text import MIMEText
from dotenv import load_dotenv

# ✅ Load environment variables
load_dotenv()


# ✅ Initialize FastAPI
app = FastAPI(title="AI-Powered Smart Resume Creation")

# ✅ Enable CORS (Frontend Access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Import UPI + Email Router AFTER FastAPI creation
try:
    from payment_api import router as payment_router
    app.include_router(payment_router)
    print("✅ Payment API router loaded successfully.")
except Exception as e:
    print(f"⚠️ Warning: Failed to import payment_api router: {e}")

# ===============================
#   DATABASE & MODEL SETUP
# ===============================
EMBEDDINGS_OK = True
try:
    from sentence_transformers import SentenceTransformer
    _MODEL_NAME = os.getenv("EMB_MODEL", "all-MiniLM-L6-v2")
    _embed_model = SentenceTransformer(_MODEL_NAME)
except Exception:
    EMBEDDINGS_OK = False
    _embed_model = None

API_DIR = pathlib.Path(__file__).resolve().parent
DB = os.getenv("DB_PATH", (API_DIR.parent / "db" / "screening.db").as_posix())
pathlib.Path(DB).parent.mkdir(parents=True, exist_ok=True)
SCHEMA_PATH = (API_DIR.parent / "db" / "schema.sql")

ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "AIRecruiter@Google_2025")


# ===============================
#   DATABASE BOOTSTRAP
# ===============================
def db():
    return sqlite3.connect(DB)

def bootstrap():
    """Initialize DB with schema and seed jobs."""
    if SCHEMA_PATH.exists():
        con = db()
        with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
            con.executescript(f.read())
        con.commit()
        cur = con.cursor()
        c = cur.execute("SELECT COUNT(*) FROM jobs").fetchone()[0]
        if c == 0:
            print("📦 Seeding default job data...")
            seed_jobs = [
                {
                    "company": "Google",
                    "role": "UI/UX Designer",
                    "title": "Product Designer",
                    "jd_text": "Design user-centric experiences using Figma, wireframes, prototyping, usability testing, and design systems.",
                    "must": ["figma", "wireframes", "prototyping", "usability testing", "design systems"],
                    "nice": ["user research", "stakeholder interviews", "component libraries"],
                    "min_exp": 2,
                    "location": "Bengaluru",
                },
                {
                    "company": "Microsoft",
                    "role": "Frontend Engineer",
                    "title": "Frontend Dev (React)",
                    "jd_text": "Build performant web apps using React, TypeScript, Next.js, Tailwind CSS and testing.",
                    "must": ["react", "typescript", "next.js", "html", "css"],
                    "nice": ["tailwind", "jest", "playwright"],
                    "min_exp": 2,
                    "location": "Hyderabad",
                },
            ]
            for s in seed_jobs:
                jid = str(uuid.uuid4())
                cur.execute(
                    "INSERT INTO jobs(id,title,jd_text,must_have,nice_to_have,min_exp_years,location,created_at) VALUES (?,?,?,?,?,?,?,?)",
                    (
                        jid,
                        f"{s['company']} - {s['title']} ({s['role']})",
                        s["jd_text"],
                        json.dumps(s["must"]),
                        json.dumps(s["nice"]),
                        s["min_exp"],
                        s["location"],
                        dt.datetime.utcnow().isoformat(),
                    ),
                )
                cur.execute(
                    "INSERT OR REPLACE INTO job_meta(job_id, company, role) VALUES (?,?,?)",
                    (jid, s["company"], s["role"]),
                )
            con.commit()
        con.close()
        
@app.post("/generate_candidate_id")
async def generate_candidate_id(email: str = Form(...)):
    """
    ✅ Generate or fetch a unique 6-digit Candidate ID and send via email only once.
    """
    con = db()
    cur = con.cursor()

    # ✅ Check if the user already has a candidate ID
    row = cur.execute("SELECT candidate_id FROM candidate_ids WHERE email=?", (email,)).fetchone()
    if row:
        candidate_id = row[0]
        con.close()
        print(f"ℹ️ Existing Candidate ID found for {email}: {candidate_id} (no email sent again)")
        return {"ok": True, "candidate_id": candidate_id, "msg": "Already exists"}

    # ❇️ Otherwise, generate a new random 6-digit candidate ID
    candidate_id = str(random.randint(100000, 999999))

    # ✅ Store in database
    cur.execute("INSERT INTO candidate_ids (email, candidate_id) VALUES (?, ?)", (email, candidate_id))
    con.commit()
    con.close()

    # ✅ Send email once
    try:
        msg = MIMEText(
            f"Hello,\n\nYour Candidate ID for AI Resume Builder is: {candidate_id}\n\n"
            f"Use this ID to analyze your resumes.\n\nThank you!\nAI Resume Builder Team"
        )
        msg["Subject"] = "Your Candidate ID - AI Resume Builder"
        msg["From"] = os.getenv("SMTP_USER", "karankundle4@gmail.com")
        msg["To"] = email

        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(
                os.getenv("SMTP_USER", "karankundle4@gmail.com"),
                os.getenv("SMTP_PASS", "your-app-password")  # 🔒 Use App Password here
            )
            server.send_message(msg)

        print(f"📩 Candidate ID sent to {email}: {candidate_id}")

    except Exception as e:
        print(f"⚠️ Email send failed for {email}: {e}")

    return {"ok": True, "candidate_id": candidate_id, "msg": "Created new"}

@app.on_event("startup")
def on_startup():
    print("🚀 Starting AI Resume Screening Backend...")
    bootstrap()
    print("✅ Database initialized.")


# ===============================
#   MODELS
# ===============================
class Job(BaseModel):
    title: str
    company: str
    role: str
    jd_text: str
    must_have: List[str] = []
    nice_to_have: List[str] = []
    min_exp_years: float = 0.0
    location: Optional[str] = None


ROLE_SKILLS = {
    "uiux": ["figma", "sketch", "adobe xd", "wireframes", "prototyping", "user research", "usability testing", "design systems", "heuristic evaluation", "component libraries", "design tokens"],
    "frontend": ["react", "next.js", "typescript", "javascript", "html", "css", "tailwind", "jest", "playwright", "redux"],
    "data": ["sql", "python", "pandas", "numpy", "power bi", "tableau", "dashboards", "etl"],
    "ml": ["python", "pytorch", "tensorflow", "ml pipelines", "feature engineering", "model deployment", "airflow", "mlops"],
    "backend": ["java", "node", "microservices", "distributed systems", "kafka", "docker", "kubernetes", "postgres"],
    "devops": ["ci/cd", "docker", "kubernetes", "terraform", "ansible", "aws", "gcp", "azure", "monitoring"],
}


# ===============================
#   HELPERS
# ===============================
def detect_role_bucket(role: str, jd: str) -> str:
    t = (role + " " + jd).lower()
    if any(k in t for k in ["ui", "ux", "designer", "design"]): return "uiux"
    if any(k in t for k in ["frontend", "react", "next"]): return "frontend"
    if any(k in t for k in ["data analyst", "analytics", "bi"]): return "data"
    if any(k in t for k in ["ml", "machine learning", "ai"]): return "ml"
    if any(k in t for k in ["backend", "distributed", "microservices"]): return "backend"
    if any(k in t for k in ["devops", "sre", "platform"]): return "devops"
    return "frontend"


def extract_text(file: UploadFile, content: bytes) -> str:
    name = (file.filename or "").lower()
    if name.endswith(".pdf"):
        with io.BytesIO(content) as f:
            return pdf_extract_text(f) or ""
    elif name.endswith(".docx"):
        with io.BytesIO(content) as f:
            doc = Document(f)
            return "\n".join(p.text for p in doc.paragraphs)
    else:
        try:
            return content.decode("utf-8", errors="ignore")
        except:
            return str(content)


def parse_resume_text(txt: str) -> Dict[str, Any]:
    low = txt.lower()
    years = 0.0
    for m in re.finditer(r"(\d+)\s*\+?\s*years?", low):
        years = max(years, float(m.group(1)))
    generic = {"excel", "sql", "python", "react", "figma", "docker", "kubernetes", "gcp", "aws", "azure", "pandas", "power bi", "adobe xd", "tableau", "typescript", "next.js", "wireframes", "prototyping", "user research", "usability testing", "design systems"}
    all_sk = set().union(*ROLE_SKILLS.values()).union(generic)
    skills = sorted({s for s in all_sk if s in low})
    return {"skills": skills, "years_exp": years}


def sim_embeddings(a: str, b: str) -> float:
    if not EMBEDDINGS_OK or _embed_model is None:
        return -1.0
    try:
        from sentence_transformers import util
        va = _embed_model.encode(a, normalize_embeddings=True)
        vb = _embed_model.encode(b, normalize_embeddings=True)
        s = float(util.cos_sim(va, vb).item())
        return max(0.0, min(1.0, (s + 1.0) / 2.0))
    except Exception:
        return -1.0


def sim_tfidf(a: str, b: str) -> float:
    vec = TfidfVectorizer(stop_words="english", min_df=1)
    X = vec.fit_transform([a, b])
    return float(max(0.0, min(1.0, cosine_similarity(X[0], X[1])[0][0])))


def fuzzy_keywords_score(keywords: List[str], text: str) -> float:
    if not keywords:
        return 0.0
    text_low = re.sub(r"\s+", " ", text.lower())
    scores = [fuzz.partial_ratio(kw.lower().strip(), text_low) / 100.0 for kw in keywords]
    return float(sum(scores) / len(scores))


def normalize_0_100(val: float) -> float:
    if val is None:
        return 0.0
    return round(max(0.0, min(1.0, float(val))) * 100.0, 1)


# ===============================
#   SCORE COMPUTATION
# ===============================
def compute_score(company: str, role: str, jd_text: str, must_have: List[str], nice_to_have: List[str], min_exp: float, resume_info: Dict[str, Any], full_text: str) -> Dict[str, Any]:
    bucket = detect_role_bucket(role, jd_text)
    dynamic_skills = ROLE_SKILLS.get(bucket, [])
    must = [m.lower().strip() for m in (must_have or [])]
    nice = [n.lower().strip() for n in (nice_to_have or [])]
    skills = set([s.lower() for s in resume_info.get("skills", [])])

    must_cov = sum(1 for m in must if m in skills) / max(1, len(must))
    sim = sim_embeddings(jd_text, full_text)
    if sim < 0:
        sim = sim_tfidf(jd_text, full_text)
    fuzzy = fuzzy_keywords_score(nice + dynamic_skills[:5], full_text)

    exp_factor = 1.0 if min_exp == 0 else min(1.0, resume_info.get("years_exp", 0.0) / min_exp)

    weighted_skill_norm = 0.0
    if skills:
        boost_terms = set(dynamic_skills + [company.lower(), role.lower()])
        weighted_sum = sum(1.25 if any(t in s for t in boost_terms) else 1.0 for s in skills)
        weighted_skill_norm = weighted_sum / len(skills)

    internal = 0.42 * must_cov + 0.28 * sim + 0.15 * fuzzy + 0.10 * exp_factor + 0.05 * min(1.0, weighted_skill_norm / 1.25)
    return {
        "accuracy": normalize_0_100(internal),
        "components": {
            "must_cov": round(must_cov, 3),
            "similarity": round(sim, 3),
            "fuzzy": round(fuzzy, 3),
            "experience": round(exp_factor, 3),
            "weighted": round(min(1.0, weighted_skill_norm / 1.25), 3),
        },
        "bucket": bucket,
    }


# ===============================
#   ROUTES
# ===============================
@app.get("/healthz")
def healthz():
    return {"ok": True, "db": DB, "embeddings": EMBEDDINGS_OK}


@app.get("/jobs")
def jobs_list():
    con = db()
    cur = con.cursor()
    rows = cur.execute(
        "SELECT j.id, j.title, jm.company, jm.role, j.location, j.created_at FROM jobs j LEFT JOIN job_meta jm ON jm.job_id = j.id ORDER BY j.created_at DESC"
    ).fetchall()
    con.close()
    return [
        {"job_id": r[0], "title": r[1], "company": r[2], "role": r[3], "location": r[4], "created_at": r[5]}
        for r in rows
    ]



@app.post("/resume/upload_file")
async def resume_upload_file(
    candidate_id: str = Form(...),
    job_id: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Upload and analyze resume file after validating candidate ID.
    """

    # ✅ Validate Candidate ID first
    con = db()
    cur = con.cursor()
    valid = cur.execute(
        "SELECT 1 FROM candidate_ids WHERE candidate_id=?",
        (candidate_id,)
    ).fetchone()

    if not valid:
        con.close()
        raise HTTPException(
            status_code=403,
            detail="❌ Add correct candidate ID before trying again."
        )

    # ✅ Validate uploaded file
    if not file.filename:
        raise HTTPException(status_code=400, detail="⚠️ No file provided.")
    if not file.filename.lower().endswith((".pdf", ".docx", ".doc", ".txt")):
        raise HTTPException(status_code=415, detail="⚠️ Unsupported file type. Upload PDF or DOCX only.")

    # ✅ Extract text
    content = await file.read()
    text = extract_text(file, content).strip()
    if not text:
        raise HTTPException(status_code=422, detail="⚠️ Parsed text is empty or unreadable.")

    # ✅ Fetch job info
    jrow = cur.execute(
        "SELECT jd_text, must_have, nice_to_have, min_exp_years FROM jobs WHERE id=?",
        (job_id,)
    ).fetchone()
    jm = cur.execute(
        "SELECT company, role FROM job_meta WHERE job_id=?",
        (job_id,)
    ).fetchone()

    if not jrow:
        con.close()
        raise HTTPException(status_code=404, detail="❌ Job not found in database.")

    jd_text = jrow[0]
    must = json.loads(jrow[1] or "[]")
    nice = json.loads(jrow[2] or "[]")
    min_exp = jrow[3] or 0.0
    company, role = (jm[0] if jm else ""), (jm[1] if jm else "")

    # ✅ Parse and compute score
    parsed = parse_resume_text(text)
    scored = compute_score(company, role, jd_text, must, nice, min_exp, parsed, text)

    # ✅ Save analysis to database
    cur.execute(
        """
        INSERT OR REPLACE INTO resumes(candidate_id, source, raw_text, parsed_json, updated_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            candidate_id,
            file.filename.split(".")[-1],
            text,
            json.dumps(parsed),
            dt.datetime.utcnow().isoformat()
        ),
    )

    cur.execute(
    "INSERT INTO rankings(job_id, candidate_id, score, reasons, created_at) VALUES (?,?,?,?,?)",
    (job_id, candidate_id, scored["accuracy"], json.dumps(scored), dt.datetime.utcnow().isoformat()),
)

    con.commit()
    con.close()

    return {
    "ok": True,
    "candidate_id": candidate_id,
    "job_id": job_id,
    "analysis": {**scored, "skills": parsed.get("skills", [])},
    "message": "✅ Resume analyzed successfully."
}



# ✅ New Route: Get Rankings by Job ID
@app.get("/rankings/{job_id}")
def get_rankings(job_id: str, candidate_id: Optional[str] = None):
    """
    ✅ Fetch only the rankings for a specific candidate_id (if provided).
    Otherwise, return all rankings for that job.
    """
    con = db()
    cur = con.cursor()

    if candidate_id:
        rows = cur.execute("""
            SELECT r.candidate_id, r.score, r.reasons, r.created_at, res.raw_text
            FROM rankings r
            LEFT JOIN resumes res ON res.candidate_id = r.candidate_id
            WHERE r.job_id = ? AND r.candidate_id = ?
            ORDER BY r.score DESC, r.created_at DESC
        """, (job_id, candidate_id)).fetchall()

    else:
        rows = cur.execute("""
            SELECT r.candidate_id, r.score, r.reasons, r.created_at, res.raw_text
            FROM rankings r
            LEFT JOIN resumes res ON res.candidate_id = r.candidate_id
            WHERE r.job_id = ?
            ORDER BY r.score DESC
        """, (job_id,)).fetchall()

    con.close()

    if not rows:
        return []  # return empty list instead of 404 for user-specific view

    data = []
    for r in rows:
        reasons = json.loads(r[2]) if r[2] else {}
        data.append({
            "candidate_id": r[0],
            "score": r[1],
            "analysis": reasons,
            "created_at": r[3],
            "resume_excerpt": r[4][:300] if r[4] else ""
        })
    return data



# ✅ Optional: Get All Rankings
@app.get("/rankings")
def get_all_rankings():
    con = db()
    cur = con.cursor()
    rows = cur.execute("""
        SELECT r.job_id, jm.company, jm.role, r.candidate_id, r.score, r.reasons, r.created_at
        FROM rankings r
        LEFT JOIN job_meta jm ON jm.job_id = r.job_id
        ORDER BY r.created_at DESC
    """).fetchall()
    con.close()
    return [
        {
            "job_id": r[0],
            "company": r[1],
            "role": r[2],
            "candidate_id": r[3],
            "score": r[4],
            "analysis": json.loads(r[5]) if r[5] else {},
            "created_at": r[6]
        }
        for r in rows
    ]

@app.get("/admin/users")
def get_all_users(admin_key: str = Query(...)):
    """
    🧠 Secure endpoint to list all users and candidate IDs.
    Access allowed only if admin_key matches ADMIN_API_KEY.
    """
    if admin_key != ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail="Unauthorized: Invalid Admin Key")

    con = db()
    cur = con.cursor()

    cur.execute("SELECT email, candidate_id FROM candidate_ids ORDER BY email ASC")
    rows = cur.fetchall()
    con.close()

    users = [{"email": r[0], "candidate_id": r[1]} for r in rows]

    return {
        "ok": True,
        "total_users": len(users),
        "users": users,
    }
    
@app.post("/chat")
async def chat_stream(request: Request):
    """
    💬 Real-time streaming chat with local Ollama (Llama 3.2)
    """
    try:
        data = await request.json()
        user_message = data.get("message", "").strip()
        if not user_message:
            return {"reply": "⚠️ Please type something."}

        def stream_ollama():
            url = "http://localhost:11434/api/generate"
            payload = {
                "model": "llama3.2",
                "prompt": f"You are a friendly AI assistant for resume and job-related questions.\nUser: {user_message}\nAI:",
                "stream": True,
            }

            with requests.post(url, json=payload, stream=True) as r:
                for line in r.iter_lines():
                    if line:
                        try:
                            part = json.loads(line)
                            if "response" in part:
                                yield part["response"]
                        except json.JSONDecodeError:
                            continue

        return StreamingResponse(stream_ollama(), media_type="text/plain")

    except requests.exceptions.ConnectionError:
        return {"reply": "❌ Could not connect to Ollama. Is it running on port 11434?"}
    except Exception as e:
        print(f"❌ Chat error: {e}")
        return {"reply": f"⚠️ Error: {str(e)}"}