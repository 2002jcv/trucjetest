import { useState } from "react";
import { questions } from "./questions";
import { TOTAL_POINTS, MAX_PER_QUESTION, scoreQuestion } from "./scoring";

const emptyPlan = () => questions.map(() => ({ wager: 0, mode: "normal" }));
const Btn = ({ className = "", ...p }) => (
  <button className={`rounded-lg px-5 py-3 font-semibold transition disabled:opacity-40 ${className}`} {...p} />
);
const Go = (p) => <Btn className="bg-orange-500 text-white hover:bg-orange-600" {...p} />;

function Intro({ onStart }) {
  return (
    <div>
      <h1 className="font-serif text-5xl font-bold">Gewaagd</h1>
      <p className="mt-3 text-lg text-slate-700">De nieuwsquiz waarin je ook moet weten wat je weet.</p>
      <ul className="mt-6 space-y-2 text-slate-700 list-disc pl-5">
        <li>Je krijgt {TOTAL_POINTS} punten en 10 vragen, maar je ziet alleen de categorieën.</li>
        <li>Verdeel je punten: zet veel in op categorieën waar je sterk in bent (max. {MAX_PER_QUESTION} per vraag).</li>
        <li>Goed antwoord = je inzet erbij. Fout = niets.</li>
        <li><b>Hefboom</b> (1x): goed levert dubbel op, fout kost je de inzet.</li>
        <li><b>Afdekken</b> (1x): je krijgt altijd de helft van je inzet, goed of fout.</li>
      </ul>
      <Go className="mt-8" onClick={onStart}>Beginnen</Go>
    </div>
  );
}

function Allocate({ plan, setPlan, onDone }) {
  const used = plan.reduce((s, p) => s + p.wager, 0);
  const left = TOTAL_POINTS - used;
  const update = (i, patch) => setPlan(plan.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const setWager = (i, v) => update(i, { wager: Math.max(0, Math.min(v, MAX_PER_QUESTION, plan[i].wager + left)) });
  const toggle = (i, mode) =>
    setPlan(plan.map((p, j) => (j === i ? { ...p, mode: p.mode === mode ? "normal" : mode } : p.mode === mode ? { ...p, mode: "normal" } : p)));

  return (
    <div>
      <div className="sticky top-0 -mx-4 bg-slate-100/95 px-4 py-3 backdrop-blur">
        <h2 className="font-serif text-2xl font-bold">Verdeel je punten</h2>
        <p className={`font-semibold ${left === 0 ? "text-green-700" : "text-orange-600"}`}>
          {left === 0 ? "Alles verdeeld" : `Nog ${left} punten te verdelen`}
        </p>
      </div>
      <ul className="mt-4 space-y-3">
        {questions.map((q, i) => (
          <li key={i} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold">{q.category}</span>
              <span className="w-12 text-right text-2xl font-bold tabular-nums">{plan[i].wager}</span>
            </div>
            <input type="range" min="0" max={MAX_PER_QUESTION} value={plan[i].wager} aria-label={`Inzet ${q.category}`}
              onChange={(e) => setWager(i, Number(e.target.value))} className="mt-2 w-full accent-orange-500" />
            <div className="mt-2 flex gap-2 text-sm">
              {[["leverage", "Hefboom"], ["hedge", "Afdekken"]].map(([m, label]) => (
                <button key={m} onClick={() => toggle(i, m)}
                  className={`rounded-full border px-3 py-1 ${plan[i].mode === m ? "border-orange-500 bg-orange-500 text-white" : "border-slate-300"}`}>
                  {label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <Go className="mt-6 w-full" disabled={left !== 0} onClick={onDone}>Start de quiz</Go>
    </div>
  );
}

function Play({ plan, onFinish }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [results, setResults] = useState([]);
  const q = questions[i];
  const { wager, mode } = plan[i];

  const pick = (idx) => {
    if (picked !== null) return;
    const correct = idx === q.answer;
    setPicked(idx);
    setResults([...results, { correct, points: scoreQuestion({ wager, correct, mode }) }]);
  };
  const next = () => {
    if (i + 1 === questions.length) return onFinish(results);
    setI(i + 1);
    setPicked(null);
  };
  const last = results[i];

  return (
    <div>
      <p className="text-slate-600">Vraag {i + 1} van {questions.length} · {q.category} · inzet {wager}
        {mode === "leverage" && " · hefboom"}{mode === "hedge" && " · afdekken"}</p>
      <h2 className="mt-3 font-serif text-3xl font-bold">{q.text}</h2>
      <div className="mt-6 space-y-3">
        {q.options.map((o, idx) => {
          const state = picked === null ? "bg-white hover:bg-orange-50"
            : idx === q.answer ? "bg-green-100 border-green-600"
            : idx === picked ? "bg-red-100 border-red-600" : "bg-white opacity-60";
          return (
            <button key={idx} onClick={() => pick(idx)} className={`w-full rounded-xl border-2 border-transparent p-4 text-left shadow-sm ${state}`}>{o}</button>
          );
        })}
      </div>
      {last && (
        <div className="mt-6">
          <p className="text-lg font-semibold">
            {last.correct ? "Goed!" : "Helaas."} {last.points >= 0 ? "+" : ""}{last.points} punten
          </p>
          <Go className="mt-3" onClick={next}>{i + 1 === questions.length ? "Bekijk je score" : "Volgende vraag"}</Go>
        </div>
      )}
    </div>
  );
}

function Results({ plan, results, onRestart }) {
  const total = results.reduce((s, r) => s + r.points, 0);
  return (
    <div>
      <h2 className="font-serif text-2xl font-bold">Je score</h2>
      <p className="mt-2 font-serif text-7xl font-bold text-orange-500">{total}</p>
      <p className="text-slate-600">van maximaal {MAX_PER_QUESTION * 2 + (TOTAL_POINTS - MAX_PER_QUESTION)}</p>
      <ul className="mt-6 divide-y divide-slate-200 rounded-xl bg-white shadow-sm">
        {questions.map((q, i) => (
          <li key={i} className="flex items-center justify-between p-3">
            <span>{results[i].correct ? "✓" : "✗"} {q.category} <span className="text-slate-500">(inzet {plan[i].wager})</span></span>
            <span className="font-semibold tabular-nums">{results[i].points > 0 ? "+" : ""}{results[i].points}</span>
          </li>
        ))}
      </ul>
      <Go className="mt-6" onClick={onRestart}>Opnieuw spelen</Go>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("intro");
  const [plan, setPlan] = useState(emptyPlan());
  const [results, setResults] = useState([]);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-xl px-4 py-10">
        {screen === "intro" && <Intro onStart={() => setScreen("allocate")} />}
        {screen === "allocate" && <Allocate plan={plan} setPlan={setPlan} onDone={() => setScreen("play")} />}
        {screen === "play" && <Play plan={plan} onFinish={(r) => { setResults(r); setScreen("results"); }} />}
        {screen === "results" && <Results plan={plan} results={results} onRestart={() => { setPlan(emptyPlan()); setScreen("intro"); }} />}
      </div>
    </main>
  );
}
