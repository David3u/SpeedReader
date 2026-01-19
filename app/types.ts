export interface ReadingConfig {
    startWpm: number;
    endWpm: number;
    rampDuration: number;
    longWordSlowdown: number;
    punctuationSlowdown: number;
    scaleLongWords: boolean;
    blinkReminder: boolean;
    initialIndex: number;
}

export const DEFAULT_CONFIG: Omit<ReadingConfig, 'initialIndex'> = {
    startWpm: 60,
    endWpm: 300,
    rampDuration: 10,
    longWordSlowdown: 0.5,
    punctuationSlowdown: 0.1,
    scaleLongWords: true,
    blinkReminder: false,
};

export const CONFIG_LIMITS = {
    startWpm: { min: 30, max: 1000, step: 10 },
    endWpm: { min: 30, max: 1500, step: 10 },
    rampDuration: { min: 0, max: 60, step: 1 },
    longWordSlowdown: { min: 0, max: 100, step: 5 },
    punctuationSlowdown: { min: 0, max: 100, step: 5 },
} as const;

export const UI_CONSTANTS = {
    UI_HIDE_DELAY: 2000,
    CONTEXT_WORDS_BEFORE: 6,
    CONTEXT_WORDS_AFTER: 6,
    LONG_WORD_THRESHOLD: 5,
    BLINK_INTERVAL: 10000, // 10 seconds
} as const;

export const PARAGRAPH_MARKER = '\u0000';
export const PUNCTUATION_REGEX = /[.,!?;:]/;
