
from io import BytesIO
from pathlib import Path
from typing import Optional

from docx import Document
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader

app = FastAPI(
    title="AI Interview Preparation System",
    description="Resume analysis, mock interviews and performance evaluation",
    version="1.0.0",
)

# Allow the React development server to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SKILLS = [
    "python", "java", "javascript", "react", "html", "css",
    "sql", "mysql", "postgresql", "mongodb", "fastapi",
    "django", "flask", "node.js", "express", "git", "github",
    "machine learning", "artificial intelligence", "data analysis",
    "pandas", "numpy", "scikit-learn", "deep learning",
    "rest api", "api", "docker", "aws", "communication",
    "problem solving", "data structures", "algorithms",
]

QUESTIONS = {
    "python": [
        "What are the main differences between a list and a tuple in Python?",
        "Explain how exception handling works in Python.",
        "What is a dictionary, and when would you use one?",
        "Explain object-oriented programming in Python.",
        "How would you debug a Python program that gives an unexpected result?",
    ],
    "web development": [
        "What is the difference between frontend and backend development?",
        "Explain how an API allows two applications to communicate.",
        "What is the purpose of React components and props?",
        "How would you handle a failed API request in a web application?",
        "What is the difference between authentication and authorization?",
    ],
    "data science": [
        "What is the difference between supervised and unsupervised learning?",
        "Why is data preprocessing important?",
        "What is overfitting, and how can it be reduced?",
        "Explain the difference between classification and regression.",
        "How would you evaluate a machine learning model?",
    ],
    "general": [
        "Tell me about yourself and your technical background.",
        "Describe a technical project you have worked on.",
        "How do you approach solving an unfamiliar problem?",
        "Tell me about a challenge you faced and how you handled it.",
        "Why are you interested in this role?",
    ],
}

# Temporary in-memory history; it resets when the server restarts.
history = []


class QuestionRequest(BaseModel):
    role: str = "General"
    count: int = 5


class EvaluationRequest(BaseModel):
    question: str
    answer: str


def extract_text(filename: str, content: bytes) -> str:
    extension = Path(filename).suffix.lower()

    try:
        if extension == ".pdf":
            reader = PdfReader(BytesIO(content))
            return "\n".join(page.extract_text() or "" for page in reader.pages)

        if extension == ".docx":
            document = Document(BytesIO(content))
            return "\n".join(p.text for p in document.paragraphs)

        if extension == ".txt":
            return content.decode("utf-8", errors="replace")

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not read this document: {exc}",
        ) from exc

    raise HTTPException(
        status_code=400,
        detail="Please upload a PDF, DOCX, or TXT resume.",
    )


def find_skills(text: str) -> list[str]:
    lowered = text.lower()
    found = []

    for skill in SKILLS:
        # Avoid matching short skills inside unrelated words.
        import re
        pattern = r"(?<!\w)" + re.escape(skill) + r"(?!\w)"
        if re.search(pattern, lowered):
            found.append(skill)

    return found


@app.get("/")
def home():
    return {"message": "AI Interview System Backend is running!"}


@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "AI Interview System"}


@app.post("/api/analyze-resume")
async def analyze_resume(
    file: UploadFile = File(...),
    job_role: str = Form("General"),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Please select a file.")

    content = await file.read()

    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Please upload a resume smaller than 5 MB.",
        )

    text = extract_text(file.filename, content)

    if not text.strip():
        raise HTTPException(
            status_code=400,
            detail="No readable text was found. Try a text-based PDF or DOCX.",
        )

    found = find_skills(text)
    role = job_role.lower()

    role_skills = {
        "python developer": [
            "python", "sql", "git", "api", "data structures",
        ],
        "web developer": [
            "html", "css", "javascript", "react", "rest api", "git",
        ],
        "data analyst": [
            "sql", "python", "pandas", "numpy", "data analysis",
        ],
        "machine learning engineer": [
            "python", "machine learning", "scikit-learn",
            "pandas", "numpy",
        ],
    }

    required = role_skills.get(role, ["communication", "problem solving"])
    matched = [skill for skill in required if skill in found]
    missing = [skill for skill in required if skill not in found]
    score = round(len(matched) / len(required) * 100) if required else 0

    result = {
        "filename": file.filename,
        "job_role": job_role,
        "skills_found": found,
        "matched_skills": matched,
        "missing_skills": missing,
        "match_score": score,
        "word_count": len(text.split()),
        "recommendations": [
            f"Add evidence of {skill} through a project or experience section."
            for skill in missing
        ],
        "note": (
            "This is a basic keyword-based analysis, not a trained AI model. "
            "Check the extracted skills for accuracy."
        ),
    }

    history.insert(0, {"type": "resume_analysis", **result})
    del history[20:]
    return result


@app.post("/api/questions")
def generate_questions(request: QuestionRequest):
    role = request.role.lower()

    if "python" in role:
        category = "python"
    elif any(word in role for word in ["web", "react", "frontend", "backend"]):
        category = "web development"
    elif any(word in role for word in ["data", "machine learning", "ai"]):
        category = "data science"
    else:
        category = "general"

    count = max(1, min(request.count, 5))
    return {
        "role": request.role,
        "questions": QUESTIONS[category][:count],
        "note": "Questions are selected from a built-in question bank.",
    }


@app.post("/api/evaluate")
def evaluate_answer(request: EvaluationRequest):
    answer = request.answer.strip()

    if len(answer) < 10:
        raise HTTPException(
            status_code=400,
            detail="Please provide a longer answer so it can be evaluated.",
        )

    words = answer.split()
    score = 0

    # Transparent demo rubric, not an AI judgement.
    if len(words) >= 30:
        score += 40
    elif len(words) >= 15:
        score += 25
    else:
        score += 15

    explanation_words = {
        "because", "therefore", "example", "for example",
        "first", "second", "result", "approach", "used",
    }
    lowered = answer.lower()
    score += min(
        30,
        sum(1 for term in explanation_words if term in lowered) * 10,
    )

    if any(char in answer for char in ".!?"):
        score += 10

    if len(set(word.lower() for word in words)) >= 12:
        score += 20

    score = min(score, 100)

    if score >= 80:
        feedback = "Good detail and structure. Practise delivering it clearly."
    elif score >= 60:
        feedback = "A reasonable start. Add a specific example and explain the result."
    else:
        feedback = "Develop your answer with a clear approach, example, and outcome."

    result = {
        "question": request.question,
        "answer": answer,
        "score": score,
        "word_count": len(words),
        "feedback": feedback,
        "note": (
            "Demo score based on answer length and basic structure. "
            "It does not measure factual correctness or replace human review."
        ),
    }

    history.insert(0, {"type": "interview_evaluation", **result})
    del history[20:]
    return result


@app.get("/api/history")
def get_history():
    return {"items": history, "count": len(history)}
