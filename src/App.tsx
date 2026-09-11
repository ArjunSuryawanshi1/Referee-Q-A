import { Award, Brain, CheckCircle2, Loader2, RotateCcw, ShieldAlert, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { generateRound } from "./lib/api";
import {
  PROGRESS_KEY,
  ROUND_KEY,
  clearSavedState,
  completeRound,
  createInitialProgress,
  getRecentlyUsedConcepts,
  getWeakAreas,
  loadJson,
  recordAnswer,
  saveJson
} from "./lib/progress";
import type { ActiveRound, AnswerRecord, Question, UserProgress } from "./shared/types";

type LoadState = "idle" | "loading" | "error";

export default function App() {
  const [progress, setProgress] = useState<UserProgress>(() =>
    loadJson(PROGRESS_KEY, createInitialProgress())
  );
  const [round, setRound] = useState<ActiveRound | null>(() => loadJson<ActiveRound | null>(ROUND_KEY, null));
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [error, setError] = useState("");
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [lastSummary, setLastSummary] = useState<UserProgress["roundHistory"][number] | null>(null);

  useEffect(() => saveJson(PROGRESS_KEY, progress), [progress]);
  useEffect(() => {
    if (round) saveJson(ROUND_KEY, round);
  }, [round]);

  useEffect(() => {
    if (!round && loadState === "idle") {
      void startNextRound(progress);
    }
  }, [round, loadState, progress]);

  const currentQuestion = round?.questions[round.currentIndex] ?? null;
  const currentAnswer = currentQuestion
    ? round?.answers.find((answer) => answer.questionId === currentQuestion.id)
    : undefined;
  const score = round?.answers.filter((answer) => answer.correct).length ?? 0;
  const weakAreas = useMemo(() => getWeakAreas(progress).slice(0, 3), [progress]);

  async function startNextRound(sourceProgress: UserProgress) {
    setLoadState("loading");
    setError("");
    try {
      const generated = await generateRound({
        difficulty: sourceProgress.currentDifficulty,
        weakConcepts: getWeakAreas(sourceProgress).slice(0, 4),
        recentlyUsedConcepts: getRecentlyUsedConcepts(round),
        forbiddenQuestionHashes: sourceProgress.answeredHashes,
        roundNumber: sourceProgress.roundNumber
      });
      setRound({
        questions: generated.questions,
        currentIndex: 0,
        answers: [],
        metadata: generated.metadata
      });
      setSummaryVisible(false);
      setLoadState("idle");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not generate the next round.");
      setLoadState("error");
    }
  }

  function chooseAnswer(question: Question, choiceId: string) {
    if (!round || currentAnswer) return;

    const result = recordAnswer(progress, question, choiceId);
    const answers = [...round.answers, result.answer];
    setProgress(result.progress);
    setRound({ ...round, answers });
  }

  function advance() {
    if (!round) return;
    const nextIndex = round.currentIndex + 1;
    if (nextIndex < round.questions.length) {
      setRound({ ...round, currentIndex: nextIndex });
      return;
    }

    const completedProgress = completeRound(progress, round.answers);
    const latestSummary = completedProgress.roundHistory[0];
    setProgress(completedProgress);
    setLastSummary(latestSummary);
    setSummaryVisible(true);
    setRound(null);
    window.localStorage.removeItem(ROUND_KEY);
    window.setTimeout(() => {
      void startNextRound(completedProgress);
    }, 1600);
  }

  function resetAll() {
    clearSavedState();
    const initial = createInitialProgress();
    setProgress(initial);
    setRound(null);
    setLastSummary(null);
    setSummaryVisible(false);
    setLoadState("idle");
    setError("");
  }

  return (
    <main className="app-shell">
      <section className="topbar" aria-label="Training status">
        <div>
          <p className="eyebrow">IFAB 2026/27 Center Referee Training</p>
          <h1>Match decisions under pressure</h1>
        </div>
        <button className="icon-button" type="button" onClick={resetAll} aria-label="Reset progress">
          <RotateCcw size={18} />
        </button>
      </section>

      <section className="status-grid" aria-label="Progress summary">
        <StatusCard label="Round" value={String(progress.roundNumber)} detail={progress.currentDifficulty} />
        <StatusCard label="Current score" value={`${score}/${round?.questions.length ?? 10}`} detail="this round" />
        <StatusCard
          label="Weak area"
          value={weakAreas[0] ?? "None yet"}
          detail={weakAreas.length ? "weighted for review" : "answer a few questions"}
        />
      </section>

      {summaryVisible && lastSummary ? <RoundSummaryCard summary={lastSummary} /> : null}

      {loadState === "loading" ? (
        <section className="quiz-card center-card" aria-live="polite">
          <Loader2 className="spin" size={30} />
          <h2>Preparing the next set of match incidents...</h2>
          <p>The generator is building 10 new scenarios and checking them before kickoff.</p>
        </section>
      ) : null}

      {loadState === "error" ? (
        <section className="quiz-card center-card" role="alert">
          <ShieldAlert size={30} />
          <h2>Could not generate a valid round</h2>
          <p>{error}</p>
          <button className="primary-button" type="button" onClick={() => void startNextRound(progress)}>
            Try again
          </button>
        </section>
      ) : null}

      {currentQuestion && loadState === "idle" ? (
        <QuestionCard
          question={currentQuestion}
          answer={currentAnswer}
          questionNumber={(round?.currentIndex ?? 0) + 1}
          total={round?.questions.length ?? 10}
          onChoose={chooseAnswer}
          onAdvance={advance}
        />
      ) : null}
    </main>
  );
}

function StatusCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="status-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function QuestionCard({
  question,
  answer,
  questionNumber,
  total,
  onChoose,
  onAdvance
}: {
  question: Question;
  answer?: AnswerRecord;
  questionNumber: number;
  total: number;
  onChoose: (question: Question, choiceId: string) => void;
  onAdvance: () => void;
}) {
  const correctChoice = question.choices.find((choice) => choice.id === question.correctChoiceId);
  const selectedChoice = question.choices.find((choice) => choice.id === answer?.selectedChoiceId);

  return (
    <section className="quiz-card">
      <div className="question-meta">
        <span>
          Question {questionNumber} of {total}
        </span>
        <span>{question.difficulty}</span>
      </div>
      <div className="progress-track" aria-label={`Round progress ${questionNumber} of ${total}`}>
        <div style={{ width: `${(questionNumber / total) * 100}%` }} />
      </div>

      <p className="teams">
        {question.teamA} <span>vs</span> {question.teamB}
      </p>
      <h2 className="scenario">{question.scenario}</h2>

      <div className="choices" role="list" aria-label="Answer choices">
        {question.choices.map((choice) => {
          const isSelected = answer?.selectedChoiceId === choice.id;
          const isCorrect = answer && choice.id === question.correctChoiceId;
          return (
            <button
              key={choice.id}
              type="button"
              aria-label={`${choice.id}. ${choice.text}`}
              className={`choice ${isSelected ? "selected" : ""} ${isCorrect ? "correct" : ""}`}
              onClick={() => onChoose(question, choice.id)}
              disabled={Boolean(answer)}
            >
              <span>{choice.id}</span>
              {choice.text}
            </button>
          );
        })}
      </div>

      {answer ? (
        <section className={`feedback ${answer.correct ? "is-correct" : "is-wrong"}`} aria-live="polite">
          <div className="feedback-title">
            {answer.correct ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
            <strong>{answer.correct ? "Correct." : "Incorrect."}</strong>
          </div>
          {!answer.correct ? (
            <p>
              You chose: <strong>{selectedChoice?.text}</strong>
            </p>
          ) : null}
          <p>{question.explanation}</p>
          {!answer.correct ? (
            <p>
              Best complete answer: <strong>{correctChoice?.text}</strong>
            </p>
          ) : null}
          <div className="reference-row">
            <span>{question.mechanicsFocus}</span>
            <span>{question.lawReferences.join(" · ")}</span>
          </div>
          <button className="primary-button" type="button" onClick={onAdvance}>
            {questionNumber === total ? "Finish round" : "Next decision"}
          </button>
        </section>
      ) : null}
    </section>
  );
}

function RoundSummaryCard({ summary }: { summary: UserProgress["roundHistory"][number] }) {
  return (
    <section className="summary-card" aria-live="polite">
      <Award size={24} />
      <div>
        <strong>
          Round {summary.roundNumber}: {summary.score}/{summary.total} ({summary.percentage}%)
        </strong>
        <p>
          {summary.weakAreas.length
            ? `Next round will revisit ${summary.weakAreas.join(", ")} with new scenarios.`
            : "Clean round. Difficulty will keep moving as your accuracy improves."}
        </p>
      </div>
      <Brain size={24} />
    </section>
  );
}
