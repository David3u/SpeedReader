"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { ReadingConfig } from '../types';
import { calculateWordDelay, calculateCurrentWpm } from '../utils';

interface UseReadingTimerProps {
    words: string[];
    config: ReadingConfig;
    isPaused: boolean;
    onIndexChange: (index: number) => void;
    onWpmChange: (wpm: number) => void;
}

export function useReadingTimer({
    words,
    config,
    isPaused,
    onIndexChange,
    onWpmChange,
}: UseReadingTimerProps) {
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(Date.now());
    const elapsedOffsetRef = useRef<number>(0);
    const indexRef = useRef(config.initialIndex);
    const isPausedRef = useRef(isPaused);

    useEffect(() => {
        isPausedRef.current = isPaused;
        if (!isPaused) {
            startTimeRef.current = Date.now();
        } else {
            const sessionActiveTime = (Date.now() - startTimeRef.current) / 1000;
            elapsedOffsetRef.current += sessionActiveTime;
        }
    }, [isPaused]);

    const tick = useCallback(() => {
        if (isPausedRef.current) return;

        const sessionActiveTime = (Date.now() - startTimeRef.current) / 1000;
        const totalElapsed = elapsedOffsetRef.current + sessionActiveTime;
        const currentWpm = calculateCurrentWpm(totalElapsed, config);

        onWpmChange(currentWpm);

        if (indexRef.current + 1 < words.length) {
            indexRef.current += 1;
            onIndexChange(indexRef.current);
            const delay = calculateWordDelay(words[indexRef.current], currentWpm, config);
            timerRef.current = setTimeout(tick, delay);
        }
    }, [config, words, onIndexChange, onWpmChange]);

    const startTimer = useCallback((currentWpm: number) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        const delay = calculateWordDelay(words[indexRef.current], currentWpm, config);
        timerRef.current = setTimeout(tick, delay);
    }, [words, config, tick]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return { indexRef, startTimer };
}
