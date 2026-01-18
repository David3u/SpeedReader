import {
    ReadingConfig,
    PUNCTUATION_REGEX,
    PARAGRAPH_MARKER,
    UI_CONSTANTS
} from '../types';

/**
 * Calculate word display duration based on WPM and word characteristics.
 * Applies slowdown for long words (sqrt scale) and punctuation.
 */
export function calculateWordDelay(
    word: string,
    currentWpm: number,
    config: Pick<ReadingConfig, 'longWordSlowdown' | 'punctuationSlowdown'>
): number {
    const baseDelay = 60000 / currentWpm;
    const length = word?.length || 0;
    let scale = 1;

    // Sqrt scaling for diminishing returns on very long words
    if (length > UI_CONSTANTS.LONG_WORD_THRESHOLD && config.longWordSlowdown > 0) {
        const extraLength = length - UI_CONSTANTS.LONG_WORD_THRESHOLD;
        scale = 1 + (Math.sqrt(extraLength) * 0.2236 * (config.longWordSlowdown / 0.5));
    }

    // Pause on punctuation and paragraph breaks
    if (config.punctuationSlowdown > 0 && word) {
        const hasPunctuation = PUNCTUATION_REGEX.test(word) || word.includes(PARAGRAPH_MARKER);
        if (hasPunctuation) {
            scale += config.punctuationSlowdown;
        }
    }

    return baseDelay * scale;
}

export function calculateCurrentWpm(
    elapsedSeconds: number,
    config: Pick<ReadingConfig, 'startWpm' | 'endWpm' | 'rampDuration'>
): number {
    if (config.rampDuration <= 0) return config.endWpm;
    const progress = Math.min(elapsedSeconds / config.rampDuration, 1);
    return config.startWpm + (config.endWpm - config.startWpm) * progress;
}

export function calculateProgress(currentIndex: number, totalWords: number): number {
    if (totalWords === 0) return 0;
    return Math.round(((currentIndex + 1) / totalWords) * 100);
}
