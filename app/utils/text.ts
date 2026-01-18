import { PARAGRAPH_MARKER } from '../types';

/**
 * Parse raw text into an array of words, marking paragraph breaks.
 * Words following a newline are marked with the PARAGRAPH_MARKER character
 * to enable pausing at paragraph boundaries.
 */
export function parseTextToWords(text: string): string[] {
    return text
        .trim()
        .split(/(\n+)/)
        .filter(s => s.length > 0)
        .reduce((acc, cur) => {
            if (cur.includes('\n')) {
                // Mark the previous word as ending a paragraph
                if (acc.length > 0) {
                    acc[acc.length - 1] += PARAGRAPH_MARKER;
                }
                return acc;
            }
            // Split on whitespace and filter empty strings
            return [...acc, ...cur.split(/[\t ]+/).filter(w => w.length > 0)];
        }, [] as string[]);
}


export function cleanWord(word: string): string {
    return word.replace(new RegExp(PARAGRAPH_MARKER, 'g'), '');
}

/**
 * Calculate the focus point (optimal recognition point) for a word.
 * Research suggests the ORP is typically to the left half of the word
 * https://www.sciencedirect.com/science/article/abs/pii/S0747563214007663
 */
export function getFocusIndex(word: string): number {
    return Math.floor(cleanWord(word).length * 0.35);
}

/**
 * Split a word into left, center, and right parts for display.
 */
export function splitWordForDisplay(word: string): {
    left: string;
    center: string;
    right: string;
} {
    const cleaned = cleanWord(word);
    const focusIndex = getFocusIndex(word);

    return {
        left: cleaned.slice(0, focusIndex),
        center: cleaned[focusIndex] || '',
        right: cleaned.slice(focusIndex + 1),
    };
}
