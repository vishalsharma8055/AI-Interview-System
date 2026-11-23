
import { useState } from "react";
import "./App.css";

const API = "http://127.0.0.1:8000";

function App() {
  const [page, setPage] = useState("Dashboard");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState(null);
  const [role, setRole] = useState("Python Developer");
  const [resume, setResume] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState(null);

  const [history, setHistory] = useState([]);

  async function requestApi(path, options = {}) {
    const response = await fetch(`${API}${path}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Something went wrong.");
    }

    return data;
  }

  async function analyzeResume(event) {
    event.preventDefault();

    if (!file) {
      setMessage("Please choose a resume file first.");
      return;
    }

    setLoading(true);
    setMessage("");
    setResume(null);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("job_role", role);

      const data = await requestApi("/api/analyze-resume", {
        method: "POST",
        body: form,
      });

      setResume(data);
      setMessage("Resume analysis completed successfully.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function startInterview() {
    setLoading(true);
    setMessage("");
    setEvaluation(null);
    setAnswer("");
    setQuestionIndex(0);

    try {
      const data = await requestApi("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, count: 5 }),
      });

      setQuestions(data.questions);
      setPage("Interview");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setEvaluation(null);

    try {
      const data = await requestApi("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questions[questionIndex],
          answer,
        }),
      });

      setEvaluation(data);
      setMessage("Answer evaluated.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    setLoading(true);
    setMessage("");

    try {
      const data = await requestApi("/api/history");
      setHistory(data.items);
      setPage("History");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function navigate(destination) {
    setMessage("");
    setPage(destination);

    if (destination === "Interview") {
      setEvaluation(null);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">AI</div>
          <div>
            <strong>InterviewIQ</strong>
            <span>Career preparation</span>
          </div>
        </div>

        <div className="menu-label">WORKSPACE</div>

        {[
          ["Dashboard", "▦"],
          ["Resume Analysis", "▤"],
          ["Interview", "◉"],
          ["History", "◷"],
        ].map(([name, icon]) => (
          <button
            key={name}
            className={`nav-item ${
              page === name ? "active" : ""
            }`}
            onClick={() =>
              name === "History" ? loadHistory() : navigate(name)
            }
          >
            <span>{icon}</span>
            {name}
          </button>
        ))}

        <div className="sidebar-bottom">
          <div className="profile-avatar">VS</div>
          <div>
            <strong>Candidate</strong>
            <span>MCA Student</span>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <span className="eyebrow">YOUR CAREER WORKSPACE</span>
            <h2>{page}</h2>
          </div>
          <div className="status-pill">
            <span className="status-dot" />
            Interview preparation
          </div>
        </header>

        {message && (
          <div className="notice" role="status">
            {message}
          </div>
        )}

        {page === "Dashboard" && (
          <section>
            <div className="welcome-panel">
              <div className="welcome-copy">
                <span className="hero-badge">AI-POWERED CAREER TOOLKIT</span>
                <h1>Prepare smarter.<br />Interview better.</h1>
                <p>
                  Analyse your skills, practise interview questions,
                  and discover where to improve.
                </p>
                <div className="button-row">
                  <button
                    className="btn btn-light"
                    onClick={startInterview}
                    disabled={loading}
                  >
                    {loading ? "Please wait..." : "Start mock interview →"}
                  </button>
                  <button
                    className="btn btn-outline-light"
                    onClick={() => navigate("Resume Analysis")}
                  >
                    Analyse my resume
                  </button>
                </div>
              </div>
              <div className="welcome-art" aria-hidden="true">
                <div className="art-ring">
                  <div className="art-center">AI</div>
                  <span className="orbit orbit-one">✓</span>
                  <span className="orbit orbit-two">✦</span>
                  <span className="orbit orbit-three">↗</span>
                </div>
              </div>
            </div>

            <div className="section-heading">
              <div>
                <h3>Your preparation toolkit</h3>
                <p>Everything you need to get interview-ready.</p>
              </div>
            </div>

            <div className="feature-grid">
              <article className="feature-card">
                <div className="feature-icon purple">▤</div>
                <h3>Resume analysis</h3>
                <p>
                  Extract skills and compare them with a target job role.
                </p>
                <button
                  className="text-button"
                  onClick={() => navigate("Resume Analysis")}
                >
                  Analyse resume →
                </button>
              </article>

              <article className="feature-card">
                <div className="feature-icon blue">◉</div>
                <h3>Mock interview</h3>
                <p>
                  Practise role-based questions and submit your answers.
                </p>
                <button
                  className="text-button"
                  onClick={startInterview}
                  disabled={loading}
                >
                  Practise now →
                </button>
              </article>

              <article className="feature-card">
                <div className="feature-icon green">↗</div>
                <h3>Skill gap analysis</h3>
                <p>
                  Identify missing skills and see what to learn next.
                </p>
                <button
                  className="text-button"
                  onClick={() => navigate("Resume Analysis")}
                >
                  Find skill gaps →
                </button>
              </article>
            </div>

            <div className="info-panel">
              <div className="info-symbol">i</div>
              <div>
                <strong>Project preview</strong>
                <p>
                  This version uses keyword-based resume matching and
                  a transparent demo scoring rubric. It does not yet
                  use a trained AI model.
                </p>
              </div>
            </div>
          </section>
        )}

        {page === "Resume Analysis" && (
          <section className="content-section">
            <div className="page-intro">
              <span className="eyebrow">SKILLS & CAREER READINESS</span>
              <h1>Resume analysis</h1>
              <p>
                Upload your resume to extract skills and compare them
                with your chosen job role.
              </p>
            </div>

            <div className="content-card">
              <form onSubmit={analyzeResume}>
                <label className="field-label" htmlFor="job-role">
                  Target job role
                </label>
                <select
                  id="job-role"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                >
                  <option>Python Developer</option>
                  <option>Web Developer</option>
                  <option>Data Analyst</option>
                  <option>Machine Learning Engineer</option>
                  <option>General</option>
                </select>

                <label className="field-label" htmlFor="resume-file">
                  Upload resume
                </label>
                <div className="upload-area">
                  <div className="upload-symbol">↑</div>
                  <strong>Choose your resume file</strong>
                  <p>PDF, DOCX, or TXT · Maximum 5 MB</p>
                  <input
                    id="resume-file"
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(event) =>
                      setFile(event.target.files?.[0] || null)
                    }
                  />
                  {file && (
                    <p className="selected-file">
                      Selected: {file.name}
                    </p>
                  )}
                </div>

                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Analysing..." : "Analyse resume"}
                </button>
              </form>
            </div>

            {resume && (
              <div className="results-area">
                <div className="result-header">
                  <div>
                    <span className="eyebrow">ANALYSIS REPORT</span>
                    <h2>{resume.filename}</h2>
                    <p>Target role: {resume.job_role}</p>
                  </div>
                  <div className="score-circle">
                    <strong>{resume.match_score}%</strong>
                    <span>Role match</span>
                  </div>
                </div>

                <div className="result-stats">
                  <div className="mini-stat">
                    <strong>{resume.skills_found.length}</strong>
                    <span>Skills found</span>
                  </div>
                  <div className="mini-stat">
                    <strong>{resume.matched_skills.length}</strong>
                    <span>Matched skills</span>
                  </div>
                  <div className="mini-stat">
                    <strong>{resume.missing_skills.length}</strong>
                    <span>Skill gaps</span>
                  </div>
                  <div className="mini-stat">
                    <strong>{resume.word_count}</strong>
                    <span>Words scanned</span>
                  </div>
                </div>

                <div className="content-card">
                  <h3>Skills detected</h3>
                  <div className="tag-list">
                    {resume.skills_found.length ? (
                      resume.skills_found.map((skill) => (
                        <span className="tag" key={skill}>{skill}</span>
                      ))
                    ) : (
                      <p>No recognised skills were detected.</p>
                    )}
                  </div>

                  <h3 className="subheading">Matched skills</h3>
                  <div className="tag-list">
                    {resume.matched_skills.length ? (
                      resume.matched_skills.map((skill) => (
                        <span className="tag tag-green" key={skill}>
                          ✓ {skill}
                        </span>
                      ))
                    ) : (
                      <p>No target-role skills matched.</p>
                    )}
                  </div>

                  <h3 className="subheading">Skills to improve</h3>
                  {resume.recommendations.length ? (
                    <ul className="recommendation-list">
                      {resume.recommendations.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No missing skills from the selected checklist.</p>
                  )}

                  <p className="disclaimer">{resume.note}</p>
                </div>
              </div>
            )}
          </section>
        )}

        {page === "Interview" && (
          <section className="content-section">
            <div className="page-intro">
              <span className="eyebrow">PRACTICE & IMPROVE</span>
              <h1>Mock interview</h1>
              <p>
                Choose your role on the dashboard workflow and practise
                answering one question at a time.
              </p>
            </div>

            {!questions.length ? (
              <div className="content-card">
                <h3>Ready to practise?</h3>
                <p className="muted">
                  Your current role selection is {role}.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={startInterview}
                  disabled={loading}
                >
                  {loading ? "Preparing..." : "Generate questions"}
                </button>
              </div>
            ) : (
              <div className="content-card interview-card">
                <div className="question-meta">
                  <span>QUESTION {questionIndex + 1} OF {questions.length}</span>
                  <span>{role}</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-value"
                    style={{
                      width: `${((questionIndex + 1) / questions.length) * 100}%`,
                    }}
                  />
                </div>

                <h2 className="question-title">
                  {questions[questionIndex]}
                </h2>

                {!evaluation ? (
                  <form onSubmit={submitAnswer}>
                    <label className="field-label" htmlFor="answer">
                      Your answer
                    </label>
                    <textarea
                      id="answer"
                      rows="7"
                      value={answer}
                      onChange={(event) => setAnswer(event.target.value)}
                      placeholder="Explain your approach and include an example..."
                      required
                      minLength={10}
                    />
                    <div className="answer-footer">
                      <span>{answer.trim() ? answer.trim().split(/\s+/).length : 0} words</span>
                      <button
                        className="btn btn-primary"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? "Evaluating..." : "Evaluate answer"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="evaluation-panel">
                    <div className="evaluation-score">
                      <strong>{evaluation.score}/100</strong>
                      <span>Demo score</span>
                    </div>
                    <h3>Feedback</h3>
                    <p>{evaluation.feedback}</p>
                    <p className="disclaimer">{evaluation.note}</p>

                    <div className="button-row">
                      {questionIndex < questions.length - 1 ? (
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            setQuestionIndex((index) => index + 1);
                            setAnswer("");
                            setEvaluation(null);
                            setMessage("");
                          }}
                        >
                          Next question →
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            setQuestions([]);
                            setEvaluation(null);
                            setPage("Dashboard");
                            setMessage("Interview practice completed.");
                          }}
                        >
                          Finish interview
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {page === "History" && (
          <section className="content-section">
            <div className="page-intro">
              <span className="eyebrow">YOUR ACTIVITY</span>
              <h1>Recent history</h1>
              <p>Resume analyses and interview evaluations from this session.</p>
            </div>

            {history.length === 0 ? (
              <div className="content-card empty-state">
                <div className="empty-icon">◷</div>
                <h3>No activity yet</h3>
                <p>Analyse a resume or evaluate an interview answer first.</p>
              </div>
            ) : (
              <div className="history-list">
                {history.map((item, index) => (
                  <article className="history-item" key={`${item.type}-${index}`}>
                    <div className="history-icon">
                      {item.type === "resume_analysis" ? "▤" : "◉"}
                    </div>
                    <div className="history-copy">
                      <strong>
                        {item.type === "resume_analysis"
                          ? "Resume analysis"
                          : "Interview evaluation"}
                      </strong>
                      <p>
                        {item.type === "resume_analysis"
                          ? `${item.filename} · ${item.job_role}`
                          : item.question}
                      </p>
                    </div>
                    <strong className="history-score">
                      {item.type === "resume_analysis"
                        ? `${item.match_score}%`
                        : `${item.score}/100`}
                    </strong>
                  </article>
                ))}
              </div>
            )}

            <p className="disclaimer">
              History is stored in backend memory and clears when the server restarts.
            </p>
          </section>
        )}

        <footer className="footer">
          <span>InterviewIQ · MCA Project Prototype</span>
          <span>Built with React and FastAPI</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
