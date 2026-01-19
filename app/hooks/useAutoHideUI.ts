"use client";

import { useState, useEffect, useRef } from 'react';
import { UI_CONSTANTS } from '../types';

export function useAutoHideUI(isPaused: boolean, isComplete: boolean = false) {
    const [showUI, setShowUI] = useState(true);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const handleMouseMove = () => {
            setShowUI(true);
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setShowUI(false), UI_CONSTANTS.UI_HIDE_DELAY);
        };

        window.addEventListener("mousemove", handleMouseMove);
        timerRef.current = setTimeout(() => setShowUI(false), UI_CONSTANTS.UI_HIDE_DELAY);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return showUI || isPaused || isComplete;
}
