"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, Terminal, Settings2, History } from "lucide-react";
import ReadingScreen from "./ReadingScreen";
import { SettingItem, SettingToggle } from "./components";
import { DEFAULT_CONFIG, CONFIG_LIMITS, type ReadingConfig } from "./types";
import { parseTextToWords } from "./utils";

const TRANSITION_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function Home() {
  const [text, setText] = useState("");
  const [isReading, setIsReading] = useState(false);
  const [lastReadIndex, setLastReadIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const [startWpm, setStartWpm] = useState(DEFAULT_CONFIG.startWpm);
  const [endWpm, setEndWpm] = useState(DEFAULT_CONFIG.endWpm);
  const [rampDuration, setRampDuration] = useState(DEFAULT_CONFIG.rampDuration);
  const [longWordSlowdown, setLongWordSlowdown] = useState(DEFAULT_CONFIG.longWordSlowdown);
  const [punctuationSlowdown, setPunctuationSlowdown] = useState(DEFAULT_CONFIG.punctuationSlowdown);
  const [scaleLongWords, setScaleLongWords] = useState(DEFAULT_CONFIG.scaleLongWords);

  const words = parseTextToWords(text);

  const startReading = (fromBeginning = true) => {
    if (words.length > 0) {
      if (fromBeginning) setLastReadIndex(0);
      setIsReading(true);
    }
  };

  const stopReading = (currentIndex: number) => {
    setLastReadIndex(currentIndex);
    setIsReading(false);
  };

  const config: ReadingConfig = {
    startWpm,
    endWpm,
    rampDuration,
    longWordSlowdown,
    punctuationSlowdown,
    scaleLongWords,
    initialIndex: lastReadIndex,
  };

  const hasResumePoint = lastReadIndex > 0 && lastReadIndex < words.length - 1;

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
            className="w-full max-w-4xl flex flex-col gap-8 relative z-10"
          >
            <div className="flex items-end justify-between">
              <h1 className="text-5xl font-light tracking-tight text-white">
                Speed <span className="font-semibold text-red-500">Reader</span>
              </h1>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-4 rounded-2xl border transition-all ${showSettings
                  ? "bg-red-500 text-white border-red-500"
                  : "bg-zinc-900/50 border-white/5 text-zinc-400"
                  }`}
              >
                <Settings2 className="w-6 h-6" />
              </button>
            </div>

            <motion.div layout className="flex flex-col lg:flex-row items-start w-full">
              <motion.div layout className="flex-1 w-full flex flex-col">
                <div className="relative group h-full">
                  <div className="absolute -inset-1 bg-gradient-to-b from-red-500/10 to-transparent rounded-[2rem] blur opacity-0 group-focus-within:opacity-100 transition duration-1000" />
                  <div className="relative bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 shadow-2xl flex flex-col h-full">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Paste your text here..."
                      className="w-full h-80 bg-transparent text-zinc-200 text-xl leading-relaxed outline-none transition-all resize-none placeholder:text-zinc-700"
                    />
                    <div className="mt-6 pt-6 border-t border-white/5 flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Terminal className="w-4 h-4" />
                        <span className="text-sm font-medium">{words.length} Words</span>
                      </div>
                      {hasResumePoint && (
                        <div className="flex items-center gap-2 text-red-400">
                          <History className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            Paused at {Math.round((lastReadIndex / words.length) * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile Settings - below textarea */}
                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      layout
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.4, ease: TRANSITION_EASE }}
                      className="w-full lg:hidden overflow-hidden"
                    >
                      <div className="bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 shadow-2xl flex flex-col gap-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Settings</h3>
                        <SettingItem
                          label="Start speed"
                          value={startWpm}
                          unit="WPM"
                          onChange={setStartWpm}
                          {...CONFIG_LIMITS.startWpm}
                        />
                        <SettingItem
                          label="End speed"
                          value={endWpm}
                          unit="WPM"
                          onChange={setEndWpm}
                          {...CONFIG_LIMITS.endWpm}
                        />
                        <SettingItem
                          label="Ramp duration"
                          value={rampDuration}
                          unit="SEC"
                          onChange={setRampDuration}
                          {...CONFIG_LIMITS.rampDuration}
                        />
                        <SettingItem
                          label="Long word slowdown"
                          value={Math.round(longWordSlowdown * 100)}
                          unit="%"
                          onChange={(v) => setLongWordSlowdown(v / 100)}
                          {...CONFIG_LIMITS.longWordSlowdown}
                        />
                        <SettingItem
                          label="Punctuation pause"
                          value={Math.round(punctuationSlowdown * 100)}
                          unit="%"
                          onChange={(v) => setPunctuationSlowdown(v / 100)}
                          {...CONFIG_LIMITS.punctuationSlowdown}
                        />
                        <SettingToggle
                          label="Scale long words"
                          checked={scaleLongWords}
                          onChange={setScaleLongWords}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Desktop Settings - beside textarea */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, x: 40, scale: 0.9, width: 0, marginLeft: 0 }}
                    animate={{ opacity: 1, x: 0, scale: 1, width: 320, marginLeft: 24 }}
                    exit={{ opacity: 0, x: 40, scale: 0.9, width: 0, marginLeft: 0 }}
                    transition={{ duration: 0.5, ease: TRANSITION_EASE, layout: { duration: 0.5, ease: TRANSITION_EASE } }}
                    className="hidden lg:flex flex-col gap-4 shrink-0 overflow-hidden"
                  >
                    <div className="w-[320px] bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 shadow-2xl flex flex-col gap-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Settings</h3>
                      <SettingItem
                        label="Start speed"
                        value={startWpm}
                        unit="WPM"
                        onChange={setStartWpm}
                        {...CONFIG_LIMITS.startWpm}
                      />
                      <SettingItem
                        label="End speed"
                        value={endWpm}
                        unit="WPM"
                        onChange={setEndWpm}
                        {...CONFIG_LIMITS.endWpm}
                      />
                      <SettingItem
                        label="Ramp duration"
                        value={rampDuration}
                        unit="SEC"
                        onChange={setRampDuration}
                        {...CONFIG_LIMITS.rampDuration}
                      />
                      <SettingItem
                        label="Long word slowdown"
                        value={Math.round(longWordSlowdown * 100)}
                        unit="%"
                        onChange={(v) => setLongWordSlowdown(v / 100)}
                        {...CONFIG_LIMITS.longWordSlowdown}
                      />
                      <SettingItem
                        label="Punctuation pause"
                        value={Math.round(punctuationSlowdown * 100)}
                        unit="%"
                        onChange={(v) => setPunctuationSlowdown(v / 100)}
                        {...CONFIG_LIMITS.punctuationSlowdown}
                      />
                      <SettingToggle
                        label="Scale long words"
                        checked={scaleLongWords}
                        onChange={setScaleLongWords}
                      />
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
                    whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -10px rgba(239, 68, 68, 0.2)" }}
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
                  whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -10px rgba(239, 68, 68, 0.2)" }}
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
          </motion.div>
        ) : (
          <ReadingScreen words={words} config={config} onBack={stopReading} />
        )}
      </AnimatePresence>
    </main >
  );
}
