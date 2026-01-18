"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, ArrowLeft } from "lucide-react";
import { ReadingConfig, UI_CONSTANTS } from "./types";
import { cleanWord, splitWordForDisplay, calculateWordDelay, calculateCurrentWpm, calculateProgress } from "./utils";
import { useAutoHideUI } from "./hooks";

interface ReadingScreenProps {
    words: string[];
    config: ReadingConfig;
    onBack: (lastIndex: number) => void;
}

export default function ReadingScreen({ words, config, onBack }: ReadingScreenProps) {
    const [index, setIndex] = useState(config.initialIndex);
    const [wpm, setWpm] = useState(config.startWpm);
    const [isPaused, setIsPaused] = useState(false);
    const showUI = useAutoHideUI(isPaused);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(Date.now());
    const elapsedOffsetRef = useRef<number>(0);
    const indexRef = useRef(config.initialIndex);
    const isPausedRef = useRef(false);

    useEffect(() => {
        isPausedRef.current = isPaused;
        if (!isPaused) {
            startTimeRef.current = Date.now();
        } else {
            elapsedOffsetRef.current += (Date.now() - startTimeRef.current) / 1000;
        }
    }, [isPaused]);

    const tick = useCallback(() => {
        if (isPausedRef.current) return;

        const totalElapsed = elapsedOffsetRef.current + (Date.now() - startTimeRef.current) / 1000;
        const currentWpm = calculateCurrentWpm(totalElapsed, config);
        setWpm(currentWpm);

        if (indexRef.current + 1 < words.length) {
            indexRef.current += 1;
            setIndex(indexRef.current);
            const delay = calculateWordDelay(words[indexRef.current], currentWpm, config);
            timerRef.current = setTimeout(tick, delay);
        }
    }, [config, words]);

    useEffect(() => {
        if (!isPaused && index < words.length - 1) {
            const delay = calculateWordDelay(words[index], wpm, config);
            timerRef.current = setTimeout(tick, delay);
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isPaused, tick, wpm, index, words, config]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                e.preventDefault();
                setIsPaused((p) => !p);
            }
            if (e.code === "Escape") {
                onBack(indexRef.current);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onBack]);

    const { left, center, right } = splitWordForDisplay(words[index] || "");
    const progress = calculateProgress(index, words.length);
    const isComplete = words.length > 0 && index === words.length - 1;

    // Scale down font for words over 9 characters (if enabled)
    const currentWord = words[index] || "";
    const wordLength = cleanWord(currentWord).length;
    const fontScale = config.scaleLongWords && wordLength > 9 ? Math.max(0.6, 1 - (wordLength - 9) * 0.05) : 1;

    return (
        <motion.div
            key="reading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(20px)" }}
            className="fixed inset-0 bg-[#070708] flex flex-col items-center justify-center z-50 overflow-hidden"
            style={{ cursor: showUI ? "auto" : "none" }}
        >
            {/* Header Controls */}
            <AnimatePresence>
                {showUI && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-0 inset-x-0 flex flex-col md:flex-row items-center justify-between gap-4 px-4 md:px-24 pt-4 md:pt-8 z-20"
                    >
                        <div className="flex items-center gap-3 md:gap-4">
                            <button
                                onClick={() => onBack(index)}
                                className="flex items-center gap-2 md:gap-3 px-5 md:px-5 py-3 md:py-2.5 rounded-full bg-zinc-900/50 border border-white/5 text-zinc-400 hover:text-white hover:border-white/20 transition-all backdrop-blur-md group"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                <span className="text-sm font-medium">Exit</span>
                            </button>
                            <button
                                onClick={() => setIsPaused(!isPaused)}
                                className="flex items-center gap-2 md:gap-3 px-5 md:px-5 py-3 md:py-2.5 rounded-full bg-red-500 text-white font-bold transition-all shadow-lg shadow-red-500/20"
                            >
                                {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
                                <span className="text-sm">{isPaused ? "Resume" : "Pause"}</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-4 md:gap-8">
                            <div className="flex flex-col items-center md:items-end">
                                <span className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 mb-1">Speed</span>
                                <span className="text-lg md:text-2xl font-mono text-zinc-100 tabular-nums">
                                    {Math.round(wpm)}<span className="text-[10px] md:text-xs text-zinc-600 ml-1">WPM</span>
                                </span>
                            </div>
                            <div className="h-8 md:h-10 w-[1px] bg-white/5" />
                            <div className="flex flex-col items-center md:items-end">
                                <span className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 mb-1">Progress</span>
                                <span className="text-lg md:text-2xl font-mono text-zinc-100 tabular-nums">
                                    {progress}<span className="text-[10px] md:text-xs text-zinc-600 ml-1">%</span>
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Progress Bar */}
            <div className="absolute bottom-0 inset-x-0 h-1 bg-zinc-900">
                <motion.div
                    className="h-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "linear", duration: 0.1 }}
                />
            </div>

            {/* Word Display */}
            <div className="relative w-full flex flex-col items-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] pointer-events-none opacity-20">
                    <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-red-500" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[1px] bg-red-500" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[1px] bg-red-500" />
                </div>

                <div
                    className={`flex items-center text-6xl md:text-9xl font-semibold tracking-[-0.02em] h-48 relative w-full transition-opacity duration-500 ${isPaused ? "opacity-30 blur-sm" : "opacity-100"}`}
                    style={{ transform: `scale(${fontScale})` }}
                >
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex-1 text-right text-white opacity-80 select-none">{left}</div>
                        <div className="text-red-500 relative px-[0.05em] select-none">
                            {center}
                            <motion.div
                                animate={{ opacity: [0.4, 0.6, 0.4], scale: [0.8, 1, 0.8] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                                className="absolute inset-0 bg-red-500/10 blur-xl rounded-full -z-10"
                            />
                        </div>
                        <div className="flex-1 text-left text-white opacity-80 select-none">{right}</div>
                    </div>
                </div>

                <AnimatePresence>
                    {isPaused && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                            <div className="px-6 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white font-bold tracking-widest uppercase text-xs">
                                Session Paused
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Context Words */}
            <AnimatePresence>
                {showUI && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-12 inset-x-0 flex justify-center items-center px-6 overflow-hidden select-none pointer-events-none"
                    >
                        <div className="w-full max-w-2xl flex items-center text-sm md:text-base font-medium whitespace-nowrap mask-fade-edges relative h-10">
                            <div className="flex-1 flex justify-end gap-3 pr-6 overflow-hidden items-center">
                                {words.slice(Math.max(0, index - UI_CONSTANTS.CONTEXT_WORDS_BEFORE), index).map((w, i) => (
                                    <span key={`prev-${i}`} className="text-white/40 shrink-0">{cleanWord(w)}</span>
                                ))}
                            </div>
                            <div className="text-red-500 font-bold px-3 py-1 bg-red-500/10 rounded flex-shrink-0 z-10 border border-red-500/20">
                                {cleanWord(words[index])}
                            </div>
                            <div className="flex-1 flex justify-start gap-3 pl-6 overflow-hidden items-center">
                                {words.slice(index + 1, index + 1 + UI_CONSTANTS.CONTEXT_WORDS_AFTER).map((w, i) => (
                                    <span key={`next-${i}`} className="text-white/40 shrink-0">{cleanWord(w)}</span>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Completion Screen */}
            <AnimatePresence>
                {isComplete && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-32 flex flex-col items-center gap-6"
                    >
                        <p className="text-zinc-500 font-medium">Session Complete</p>
                        <button
                            onClick={() => onBack(0)}
                            className="flex items-center gap-3 px-10 py-5 bg-white text-black rounded-full font-bold text-lg hover:bg-zinc-200 transition-all shadow-2xl shadow-white/5"
                        >
                            <RotateCcw className="w-5 h-5" />
                            Reset
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-overlay" />
        </motion.div>
    );
}
