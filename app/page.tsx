"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock3,
  History,
  Play,
  RotateCcw,
  Settings2,
  Terminal,
  Trash2,
} from "lucide-react";
import ReadingScreen from "./ReadingScreen";
import { SettingItem, SettingToggle } from "./components";
import {
  CONFIG_LIMITS,
  type PersistedReaderState,
  type PersistedSettings,
  type ReadingConfig,
  type TextHistoryEntry,
} from "./types";
import {
  loadPersistedReaderState,
  parseTextToWords,
  savePersistedReaderState,
  upsertHistoryEntry,
} from "./utils";

const TRANSITION_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function formatHistoryTimestamp(updatedAt: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(updatedAt));
}

function getResumeProgress(lastReadIndex: number, wordCount: number): number {
  if (wordCount <= 0) {
    return 0;
  }

  return Math.round((lastReadIndex / wordCount) * 100);
}

function SettingsPanel({
  settings,
  onChange,
}: {
  settings: PersistedSettings;
  onChange: (updates: Partial<PersistedSettings>) => void;
}) {
  return (
    <div className="bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 shadow-2xl flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-500">Settings</h3>
      </div>
      <SettingItem
        label="Start speed"
        value={settings.startWpm}
        unit="WPM"
        onChange={(value) => onChange({ startWpm: value })}
        {...CONFIG_LIMITS.startWpm}
      />
      <SettingItem
        label="End speed"
        value={settings.endWpm}
        unit="WPM"
        onChange={(value) => onChange({ endWpm: value })}
        {...CONFIG_LIMITS.endWpm}
      />
      <SettingItem
        label="Ramp duration"
        value={settings.rampDuration}
        unit="SEC"
        onChange={(value) => onChange({ rampDuration: value })}
        {...CONFIG_LIMITS.rampDuration}
      />
      <SettingItem
        label="Long word slowdown"
        value={Math.round(settings.longWordSlowdown * 100)}
        unit="%"
        onChange={(value) => onChange({ longWordSlowdown: value / 100 })}
        {...CONFIG_LIMITS.longWordSlowdown}
      />
      <SettingItem
        label="Punctuation pause"
        value={Math.round(settings.punctuationSlowdown * 100)}
        unit="%"
        onChange={(value) => onChange({ punctuationSlowdown: value / 100 })}
        {...CONFIG_LIMITS.punctuationSlowdown}
      />
      <SettingToggle
        label="Scale long words"
        checked={settings.scaleLongWords}
        onChange={(value) => onChange({ scaleLongWords: value })}
      />
      <SettingToggle
        label="Blink reminder"
        checked={settings.blinkReminder}
        onChange={(value) => onChange({ blinkReminder: value })}
      />
    </div>
  );
}

function TextHistoryPanel({
  entries,
  activeHistoryId,
  onSelect,
  onDelete,
}: {
  entries: TextHistoryEntry[];
  activeHistoryId: string | null;
  onSelect: (entry: TextHistoryEntry) => void;
  onDelete: (entryId: string) => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-900/35 p-6 backdrop-blur-2xl shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.08),transparent_38%)] pointer-events-none" />
      <div className="relative">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-zinc-400">
              <History className="h-4 w-4 text-red-400" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.28em]">
                History
              </span>
            </div>
          </div>
        </div>

        {entries.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {entries.map((entry, index) => {
              const canResume =
                entry.lastReadIndex > 0 && entry.lastReadIndex < entry.wordCount - 1;
              const progress = getResumeProgress(entry.lastReadIndex, entry.wordCount);
              const isActive = activeHistoryId === entry.id;

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: index * 0.04,
                    ease: TRANSITION_EASE,
                  }}
                  className={`group relative overflow-hidden rounded-[1.6rem] border p-4 transition-all bg-black/20 ${
                    isActive ? "border-red-500/40" : "border-white/6"
                  }`}
                >
                  <button onClick={() => onSelect(entry)} className="w-full text-left">
                    <div className="flex items-start justify-between gap-4 pr-10">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold tracking-tight text-white">
                          {entry.title}
                        </h3>
                      </div>
                    </div>

                    <p
                      className="text-sm leading-6 text-zinc-400"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {entry.preview}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-2">
                        <Terminal className="h-3.5 w-3.5" />
                        {entry.wordCount} words
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatHistoryTimestamp(entry.updatedAt)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/6">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-red-500 via-red-400 to-orange-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="min-w-11 text-right text-xs font-medium text-zinc-400">
                        {canResume ? `${progress}%` : "new"}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-red-300">
                        {canResume ? `Continue from ${progress}%` : "Open and begin"}
                      </span>
                      <span className="text-sm font-medium text-zinc-500 transition-colors group-hover:text-zinc-200">
                        Load text
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => onDelete(entry.id)}
                    className="absolute right-4 top-4 rounded-full border border-white/8 bg-black/25 p-2 text-zinc-500 transition-colors hover:border-red-500/40 hover:text-red-300"
                    aria-label={`Delete ${entry.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-[1.6rem] border border-dashed border-white/8 bg-black/20 px-6 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-300">
              <History className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold tracking-tight text-white">
              Your next session will land here.
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
              Start reading any text and it will be saved locally with its latest
              progress so you can return to it later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const isClient = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  if (!isClient) {
    return (
      <main className="min-h-screen bg-[#070708] text-zinc-100 flex items-center justify-center p-6 overflow-hidden">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-500/5 rounded-full blur-[120px]" />
        </div>
      </main>
    );
  }

  return <HomeClient initialState={loadPersistedReaderState()} />;
}

function HomeClient({ initialState }: { initialState: PersistedReaderState }) {
  const [text, setText] = useState(initialState.currentText);
  const [isReading, setIsReading] = useState(false);
  const [lastReadIndex, setLastReadIndex] = useState(initialState.lastReadIndex);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<PersistedSettings>(initialState.settings);
  const [historyEntries, setHistoryEntries] = useState<TextHistoryEntry[]>(
    initialState.history,
  );
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(
    initialState.currentHistoryId,
  );

  const words = parseTextToWords(text);
  const safeLastReadIndex =
    words.length > 0 ? Math.min(lastReadIndex, words.length - 1) : 0;

  useEffect(() => {
    const persistedState: PersistedReaderState = {
      settings,
      currentText: text,
      currentHistoryId: activeHistoryId,
      lastReadIndex: safeLastReadIndex,
      history: historyEntries,
    };

    savePersistedReaderState(persistedState);
  }, [activeHistoryId, historyEntries, safeLastReadIndex, settings, text]);

  const updateSettings = (updates: Partial<PersistedSettings>) => {
    setSettings((current) => ({
      ...current,
      ...updates,
    }));
  };

  const saveTextToHistory = (nextText: string, nextIndex: number) => {
    const result = upsertHistoryEntry(historyEntries, nextText, nextIndex);

    if (!result.entry) {
      return;
    }

    setHistoryEntries(result.history);
    setActiveHistoryId(result.entry.id);
  };

  const startReading = (fromBeginning = true) => {
    if (words.length === 0) {
      return;
    }

    const nextIndex = fromBeginning ? 0 : safeLastReadIndex;

    if (fromBeginning) {
      setLastReadIndex(0);
    }

    saveTextToHistory(text, nextIndex);
    setIsReading(true);
  };

  const stopReading = (currentIndex: number) => {
    const nextIndex =
      words.length > 0 ? Math.min(Math.max(currentIndex, 0), words.length - 1) : 0;

    setLastReadIndex(nextIndex);
    setIsReading(false);
    saveTextToHistory(text, nextIndex);
  };

  const handleTextChange = (nextText: string) => {
    setText(nextText);
    setLastReadIndex(0);
    setActiveHistoryId(null);
  };

  const handleSelectHistoryEntry = (entry: TextHistoryEntry) => {
    setText(entry.text);
    setLastReadIndex(entry.lastReadIndex);
    setActiveHistoryId(entry.id);
  };

  const handleDeleteHistoryEntry = (entryId: string) => {
    setHistoryEntries((current) => current.filter((entry) => entry.id !== entryId));

    if (activeHistoryId === entryId) {
      setActiveHistoryId(null);
    }
  };

  const config: ReadingConfig = {
    ...settings,
    initialIndex: safeLastReadIndex,
  };

  const hasResumePoint = safeLastReadIndex > 0 && safeLastReadIndex < words.length - 1;

  return (
    <main className="min-h-screen bg-[#070708] text-zinc-100 flex flex-col items-center justify-center p-6 selection:bg-red-500/30 overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-500/5 rounded-full blur-[120px]" />
      </div>

      <AnimatePresence mode="wait">
        {!isReading ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
            transition={{ duration: 0.5, ease: TRANSITION_EASE }}
            className="w-full max-w-5xl flex flex-col gap-8 relative z-10"
          >
            <div className="flex items-end justify-between gap-4">
              <div>
                <h1 className="text-5xl font-light tracking-tight text-white">
                  Speed <span className="font-semibold text-red-500">Reader</span>
                </h1>
              </div>

              <button
                onClick={() => setShowSettings((current) => !current)}
                className={`p-4 rounded-2xl border transition-all ${
                  showSettings
                    ? "bg-red-500 text-white border-red-500 shadow-[0_20px_50px_-30px_rgba(239,68,68,0.85)]"
                    : "bg-zinc-900/50 border-white/5 text-zinc-400 hover:text-white hover:border-white/15"
                }`}
                aria-label="Toggle settings"
              >
                <Settings2 className="w-6 h-6" />
              </button>
            </div>

            <div className="w-full flex flex-col gap-6">
              <motion.div layout className="flex flex-col lg:flex-row items-start w-full">
                <motion.div layout className="flex-1 min-w-0 w-full flex flex-col gap-6">
                <div className="relative group h-full">
                  <div className="absolute -inset-1 bg-gradient-to-b from-red-500/10 to-transparent rounded-[2rem] blur opacity-0 group-focus-within:opacity-100 transition duration-1000" />
                  <div className="relative bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 shadow-2xl flex flex-col h-full">
                    <textarea
                      value={text}
                      onChange={(event) => handleTextChange(event.target.value)}
                      placeholder="Paste your text here..."
                      className="w-full h-80 bg-transparent text-zinc-200 text-xl leading-relaxed outline-none transition-all resize-none placeholder:text-zinc-700"
                    />
                    <div className="mt-6 pt-6 border-t border-white/5 flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-2 text-zinc-500">
                        <span className="text-sm font-medium">
                          {words.length} Words
                        </span>
                      </div>
                      {hasResumePoint && (
                        <div className="flex items-center gap-2 text-red-400">
                          <History className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            Paused at{" "}
                            {getResumeProgress(safeLastReadIndex, words.length)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                </motion.div>

                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      layout
                      initial={{ opacity: 0, x: 40, scale: 0.9, width: 0, marginLeft: 0 }}
                      animate={{ opacity: 1, x: 0, scale: 1, width: 320, marginLeft: 24 }}
                      exit={{ opacity: 0, x: 40, scale: 0.9, width: 0, marginLeft: 0 }}
                      transition={{
                        duration: 0.5,
                        ease: TRANSITION_EASE,
                        layout: { duration: 0.5, ease: TRANSITION_EASE },
                      }}
                      className="hidden lg:flex flex-col gap-4 shrink-0 overflow-hidden"
                    >
                      <div className="w-[320px]">
                        <SettingsPanel settings={settings} onChange={updateSettings} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <div className="flex items-center justify-end gap-4">
                {hasResumePoint ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => startReading(true)}
                      className="px-8 py-5 bg-zinc-900 text-zinc-400 rounded-full font-bold text-lg border border-white/5 hover:bg-zinc-800 hover:text-white transition-all flex items-center gap-3"
                    >
                      <RotateCcw className="w-5 h-5" />
                      Restart
                    </motion.button>
                    <motion.button
                      whileHover={{
                        scale: 1.02,
                        boxShadow: "0 20px 40px -10px rgba(239, 68, 68, 0.2)",
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => startReading(false)}
                      className="relative group flex items-center gap-3 px-10 py-5 bg-white text-black rounded-full font-bold text-lg hover:bg-zinc-100 transition-all overflow-hidden shadow-2xl"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      Resume
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    whileHover={{
                      scale: 1.02,
                      boxShadow: "0 20px 40px -10px rgba(239, 68, 68, 0.2)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => startReading(true)}
                    disabled={words.length === 0}
                    className="relative group flex items-center gap-3 px-10 py-5 bg-white text-black rounded-full font-bold text-lg hover:bg-zinc-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed overflow-hidden shadow-2xl"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    Begin Session
                  </motion.button>
                )}
              </div>

              <TextHistoryPanel
                entries={historyEntries}
                activeHistoryId={activeHistoryId}
                onSelect={handleSelectHistoryEntry}
                onDelete={handleDeleteHistoryEntry}
              />

              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 0 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.4, ease: TRANSITION_EASE }}
                    className="w-full lg:hidden overflow-hidden"
                  >
                    <SettingsPanel settings={settings} onChange={updateSettings} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <ReadingScreen words={words} config={config} onBack={stopReading} />
        )}
      </AnimatePresence>
    </main>
  );
}
