CREATE TABLE IF NOT EXISTS jobs(
  id TEXT PRIMARY KEY,
  title TEXT,
  jd_text TEXT,
  must_have TEXT,
  nice_to_have TEXT,
  min_exp_years REAL,
  location TEXT,
  created_at TEXT
);
CREATE TABLE IF NOT EXISTS job_meta(
  job_id TEXT PRIMARY KEY,
  company TEXT,
  role TEXT
);
CREATE TABLE IF NOT EXISTS resumes(
  candidate_id TEXT PRIMARY KEY,
  source TEXT,
  raw_text TEXT,
  parsed_json TEXT,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS rankings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id TEXT,
    candidate_id TEXT,
    score REAL,
    reasons TEXT,
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS candidate_ids (
    email TEXT PRIMARY KEY,
    candidate_id TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
