import React, { useMemo, useState } from "react";
import { Check, CircleDashed, Sparkles } from "lucide-react";
import { evaluateRubric } from "../../sim/rubric";
import { cn, GhostButton, PrimaryButton } from "../ui";

export default function AnswerBox({ placeholder, starters, ideas, onSubmit, result, submitLabel = "Check my explanation", passAction }) {
  const [text, setText] = useState("");
  const live = useMemo(() => evaluateRubric(text, ideas), [text, ideas]);
  const shown = result && result.text === text ? result.result : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {starters.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setText((t) => (t ? `${t.trim()} ${s}` : s))}
            className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-white/80 transition hover:bg-white/10"
          >
            {s.trim()}…
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none rounded-xl border border-white/15 bg-slate-900/70 p-3 text-sm text-white placeholder:text-white/35 focus:border-emerald-400/60 focus:outline-none"
      />
      <ul className="space-y-1.5">
        {live.ideas.map((idea) => (
          <li key={idea.id} className={cn("flex items-start gap-2 text-sm transition", idea.met ? "text-emerald-200" : "text-white/55")}>
            {idea.met ? <Check size={16} className="mt-0.5 shrink-0" strokeWidth={3} /> : <CircleDashed size={16} className="mt-0.5 shrink-0" />}
            <span>
              {idea.label}
              {!idea.required && <span className="ml-1 text-[11px] text-white/35">(bonus)</span>}
            </span>
          </li>
        ))}
      </ul>
      {shown && (
        <div
          className={cn(
            "rounded-xl p-3 text-sm",
            shown.requiredMet ? "bg-emerald-400/10 text-emerald-50" : "bg-amber-300/10 text-amber-50"
          )}
        >
          {shown.requiredMet ? (
            <span className="flex items-center gap-2">
              <Sparkles size={15} /> Your explanation includes the key scientific ideas.
            </span>
          ) : (
            shown.hint
          )}
        </div>
      )}
      <div className="flex gap-2">
        {shown?.requiredMet && passAction ? (
          passAction
        ) : (
          <PrimaryButton disabled={text.trim().length < 8} onClick={() => onSubmit(text)} className="flex-1">
            {submitLabel}
          </PrimaryButton>
        )}
        {text && (
          <GhostButton onClick={() => setText("")} className="px-3">
            Clear
          </GhostButton>
        )}
      </div>
    </div>
  );
}
