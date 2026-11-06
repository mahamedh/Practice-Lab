import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Droplets,
  Maximize2,
  Menu,
  Sparkles,
  Sprout,
  Sun,
  Wind,
  X,
} from "lucide-react";
import LabShell, { prefetchLab } from "./lab/LabShell";
import { enterFullscreen } from "./lab/fullscreen";
import { useLabStore } from "./sim/labStore";
import scenarios from "./data/scenarios.json";
import chapter from "./data/chapter10_2.json";

function cn(...values) {
  return values.filter(Boolean).join(" ");
}

function BookShell({ children, onJumpToLab }) {
  const [tocOpen, setTocOpen] = useState(false);
  const toc = [
    ["Introduction: Photosynthesis", "189"],
    ["10.1 Photosynthesis feeds the biosphere", "190"],
    ["10.2 Light energy to chemical energy", "191"],
    ["10.3 The light reactions", "194"],
    ["10.4 The Calvin cycle", "198"],
    ["10.5 Carbon fixation in hot, arid climates", "202"],
    ["10.6 Photosynthesis review", "206"],
    ["Summary of Key Concepts", "210"],
    ["Test Your Understanding", "213"],
    ["Practice Lab: Save the plant", "215"],
  ];
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="fixed inset-x-0 top-0 z-50 flex h-12 items-center justify-center border-t-2 border-slate-950 bg-white px-4 shadow-sm">
        <div className="text-sm font-semibold text-violet-900">Chapter 10: Photosynthesis</div>
        <button className="absolute right-5 rounded-full border border-slate-400 px-4 py-1.5 text-xs font-semibold">Continue in the app</button>
      </div>

      <div className="fixed bottom-12 left-0 top-12 z-40 w-14 border-r bg-white shadow-sm">
        {[BookOpen, Sparkles, Menu, CircleHelp].map((Icon, i) => (
          <button
            key={i}
            onClick={() => i === 2 && setTocOpen((v) => !v)}
            className={cn("mx-auto my-3 grid h-10 w-10 place-items-center rounded-full", i === 2 && "bg-violet-700 text-white")}
          >
            <Icon size={19} />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {tocOpen && (
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            className="fixed bottom-12 left-14 top-14 z-30 w-[320px] overflow-hidden rounded-r-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between p-5">
              <h2 className="text-xl font-bold">Table of contents</h2>
              <button onClick={() => setTocOpen(false)}><X /></button>
            </div>
            <div className="flex border-b px-4 text-xs text-slate-500">
              <span className="border-b-2 border-violet-700 px-3 py-3 font-bold text-slate-950">Contents</span>
              <span className="px-3 py-3">Bookmarks</span>
              <span className="px-3 py-3">Recent</span>
            </div>
            <div className="h-[calc(100%-107px)] overflow-y-auto">
              <div className="border-b px-5 py-4 text-sm font-bold">Chapter 10: Photosynthesis</div>
              {toc.map(([title, page], index) => (
                <button
                  key={title}
                  onClick={() => index === toc.length - 1 && onJumpToLab()}
                  className={cn(
                    "flex w-full items-start justify-between border-b px-6 py-3 text-left text-xs leading-5 hover:bg-violet-50",
                    index === 2 && "border-l-4 border-violet-300 bg-violet-50 font-bold",
                    index === toc.length - 1 && "border-l-4 border-violet-700 bg-violet-50 font-bold"
                  )}
                >
                  <span className="pr-3">{index === toc.length - 1 ? "⚗ " : ""}{title}</span>
                  <span>{page}</span>
                </button>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className={cn("pb-20 pt-12 transition-all", tocOpen ? "ml-[374px]" : "ml-14")}>
        {children}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 flex h-12 items-center justify-center gap-5 border-t bg-slate-50">
        <ChevronLeft size={20} />
        <div className="rounded border border-violet-800 px-6 py-1 text-sm">215</div>
        <ChevronRight size={20} />
      </div>
    </div>
  );
}

function launchLab() {
  enterFullscreen();
  useLabStore.getState().openLab();
}

const INPUTS = [
  { icon: Sun, label: "Sunlight", tone: "text-amber-300" },
  { icon: Droplets, label: "Water", tone: "text-sky-300" },
  { icon: Wind, label: "CO₂", tone: "text-slate-200" },
];

function LabLauncher() {
  const { mission } = scenarios;
  return (
    <button
      type="button"
      onClick={launchLab}
      className="group relative block w-full overflow-hidden rounded-[28px] border border-emerald-900/40 bg-slate-950 text-left text-white shadow-2xl shadow-slate-900/25 transition hover:-translate-y-0.5"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_8%,rgba(253,224,71,0.55),transparent_28%),linear-gradient(180deg,#0c4a6e_0%,#0f766e_55%,#14532d_100%)]" />
      <div className="absolute bottom-0 right-[12%] h-40 w-56 rounded-t-[48%] border-x-[10px] border-t-[10px] border-white/15" />
      <Sprout className="absolute bottom-6 right-[19%] h-32 w-32 text-lime-300 drop-shadow-[0_0_30px_rgba(190,242,100,0.45)] transition group-hover:scale-105" strokeWidth={1.4} />
      <div className="relative grid gap-6 p-9 md:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-200">{mission.eyebrow}</div>
          <h2 className="mt-3 text-4xl font-bold">{mission.title}</h2>
          <p className="mt-3 max-w-lg text-base leading-7 text-emerald-50/85">{mission.body}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {INPUTS.map(({ icon: Icon, label, tone }) => (
              <span key={label} className="flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/40 px-3 py-1.5 text-sm font-semibold">
                <Icon size={16} className={tone} />
                {label}
              </span>
            ))}
          </div>
          <span className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-lime-300 px-6 py-3 font-bold text-slate-950 shadow-lg shadow-emerald-950/30">
            <Maximize2 size={18} />
            Lets Practice!
          </span>
          <div className="mt-3 text-xs text-emerald-50/60">Opens full screen · greenhouse, leaf, chloroplast · about 20 minutes</div>
        </div>
      </div>
    </button>
  );
}

const LAB_LINK = { zoom: "Zoom in yourself in the lab", atoms: "Run the ¹⁸O experiments in the lab", system: "Test both stages in the lab" };

function LabStrip({ shots, lab, onJumpToLab }) {
  const single = shots.length === 1;
  const cta = (
    <button type="button" onClick={onJumpToLab} className="text-sm font-semibold text-lime-300 hover:underline">
      {LAB_LINK[lab] ?? "Open the Practice Lab"} →
    </button>
  );
  const thumb = (shot) => (
    <button
      type="button"
      onClick={onJumpToLab}
      className="block w-full overflow-hidden rounded-lg border border-white/10 transition hover:border-emerald-300/60 hover:shadow-lg hover:shadow-emerald-500/10"
    >
      <img src={shot.src} alt={shot.caption} loading="lazy" className="aspect-[1440/860] w-full object-cover" />
    </button>
  );
  return (
    <div className="mt-3 rounded-xl bg-slate-950 p-4 text-white shadow-xl shadow-slate-900/20">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300">In the Practice Lab ·</div>
        {!single && cta}
      </div>
      {single ? (
        <div className="mt-3 grid items-center gap-4 md:grid-cols-[1.6fr_1fr]">
          {thumb(shots[0])}
          <div>
            <p className="text-[15px] leading-6 text-white/85">{shots[0].caption}</p>
            <div className="mt-3">{cta}</div>
          </div>
        </div>
      ) : (
        <div className={cn("mt-3 grid gap-3", shots.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
          {shots.map((shot) => (
            <div key={shot.src}>
              {thumb(shot)}
              <p className="mt-1.5 text-[12px] leading-5 text-white/70">{shot.caption}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FigureBlock({ block, onJumpToLab }) {
  const caption = (
    <figcaption className="text-[15px] leading-7 text-slate-700">
      <span className="font-bold text-emerald-800">{block.label}</span> {block.text}
    </figcaption>
  );
  const image = block.image && (
    <img src={block.image} alt={block.alt ?? block.label} loading="lazy" className="w-full rounded-lg border border-slate-200 bg-white p-2" />
  );
  return (
    <figure className="my-8 font-sans">
      <div className="rounded-xl border-l-4 border-emerald-600 bg-emerald-50/60 px-5 py-4">
        {block.image && <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Static figure · textbook</div>}
        {block.layout === "tall" ? (
          <div className="grid items-start gap-6 md:grid-cols-[300px_1fr]">
            {image}
            {caption}
          </div>
        ) : (
          <>
            {image && <div className="mb-3">{image}</div>}
            {caption}
          </>
        )}
        {!block.labShots && LAB_LINK[block.lab] && (
          <button type="button" onClick={onJumpToLab} className="mt-2 text-sm font-semibold text-violet-700 hover:underline">
            ⚗ {LAB_LINK[block.lab]}
          </button>
        )}
      </div>
      {block.labShots && <LabStrip shots={block.labShots} lab={block.lab} onJumpToLab={onJumpToLab} />}
    </figure>
  );
}

function BookBlock({ block, onJumpToLab }) {
  switch (block.type) {
    case "h2":
      return <h2 className="mt-12 max-w-3xl text-3xl font-normal leading-snug text-[#285a9a]">{block.text}</h2>;
    case "h3":
      return <h3 className="mt-8 max-w-3xl text-xl font-bold text-slate-800">{block.text}</h3>;
    case "equation":
      return (
        <div className="my-6 max-w-3xl whitespace-pre-line rounded-lg bg-slate-50 px-6 py-4 text-center font-sans text-[17px] leading-8 text-slate-800">{block.text}</div>
      );
    case "figure":
      return <FigureBlock block={block} onJumpToLab={onJumpToLab} />;
    case "check":
      return (
        <section className="mt-12 max-w-3xl rounded-xl border border-slate-200 px-6 py-5 font-sans">
          <div className="text-sm font-bold uppercase tracking-[0.18em] text-[#285a9a]">{block.title}</div>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-[15px] leading-7 text-slate-700">
            {block.items.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-slate-500">You will answer these on your lab sheet.</p>
        </section>
      );
    default:
      return <p className="mt-5 max-w-3xl text-lg leading-8">{block.text}</p>;
  }
}

function BookContent({ onJumpToLab }) {
  return (
    <article className="max-w-4xl font-serif">
      <div className="text-sm text-slate-500">{chapter.concept}</div>
      <h1 className="mt-3 max-w-3xl text-5xl font-normal leading-tight text-[#285a9a]">{chapter.title}</h1>
      {chapter.book.map((block, i) => (
        <BookBlock key={i} block={block} onJumpToLab={onJumpToLab} />
      ))}
      <div className="mt-10 max-w-3xl border-t pt-4 text-xs font-bold tracking-[0.2em] text-slate-500">END OF {chapter.concept.toUpperCase()}</div>
    </article>
  );
}

function useDemoFlag() {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("demo")) useLabStore.getState().openLab();
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
    idle(prefetchLab);
  }, []);
}

export default function App() {
  const labRef = React.useRef(null);
  useDemoFlag();
  return (
    <>
      <BookShell onJumpToLab={() => labRef.current?.scrollIntoView({ behavior: "smooth" })}>
        <div className="mx-auto max-w-[1100px] px-8 py-10">
          <BookContent onJumpToLab={() => labRef.current?.scrollIntoView({ behavior: "smooth" })} />
          <div ref={labRef} className="mt-6"><LabLauncher /></div>
        </div>
      </BookShell>
      <LabShell />
    </>
  );
}
