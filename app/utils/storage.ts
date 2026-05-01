import {
    CONFIG_LIMITS,
    DEFAULT_CONFIG,
    type PersistedReaderState,
    type PersistedSettings,
    type TextHistoryEntry,
    UI_CONSTANTS,
} from "../types";
import { parseTextToWords } from "./text";

const STORAGE_KEY = "speed-reader-state:v1";

export const DEFAULT_PERSISTED_STATE: PersistedReaderState = {
    settings: DEFAULT_CONFIG,
    currentText: "",
    currentHistoryId: null,
    lastReadIndex: 0,
    history: [],
};

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
    if (typeof value !== "number" || Number.isNaN(value)) {
        return fallback;
    }

    return Math.min(max, Math.max(min, value));
}

function clampIndex(index: unknown, wordCount: number): number {
    if (typeof index !== "number" || Number.isNaN(index) || wordCount <= 0) {
        return 0;
    }

    return Math.min(wordCount - 1, Math.max(0, Math.round(index)));
}

function truncate(value: string, limit: number): string {
    if (value.length <= limit) {
        return value;
    }

    return `${value.slice(0, limit - 3).trimEnd()}...`;
}

function hashText(text: string): string {
    let hash = 0;

    for (let index = 0; index < text.length; index += 1) {
        hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
    }

    return `text-${hash.toString(16)}`;
}

function buildTitle(text: string): string {
    const firstLine = text.split("\n").map((line) => line.trim()).find(Boolean) ?? "";
    const compact = firstLine.replace(/\s+/g, " ");

    return truncate(compact || "Saved text", 52);
}

function buildPreview(text: string): string {
    return truncate(text.replace(/\s+/g, " ").trim(), 160);
}

function normalizeSettings(raw: unknown): PersistedSettings {
    const source = typeof raw === "object" && raw !== null ? raw as Partial<PersistedSettings> : {};

    return {
        startWpm: clampNumber(source.startWpm, DEFAULT_CONFIG.startWpm, CONFIG_LIMITS.startWpm.min, CONFIG_LIMITS.startWpm.max),
        endWpm: clampNumber(source.endWpm, DEFAULT_CONFIG.endWpm, CONFIG_LIMITS.endWpm.min, CONFIG_LIMITS.endWpm.max),
        rampDuration: clampNumber(source.rampDuration, DEFAULT_CONFIG.rampDuration, CONFIG_LIMITS.rampDuration.min, CONFIG_LIMITS.rampDuration.max),
        longWordSlowdown: clampNumber(
            source.longWordSlowdown,
            DEFAULT_CONFIG.longWordSlowdown,
            CONFIG_LIMITS.longWordSlowdown.min / 100,
            CONFIG_LIMITS.longWordSlowdown.max / 100,
        ),
        punctuationSlowdown: clampNumber(
            source.punctuationSlowdown,
            DEFAULT_CONFIG.punctuationSlowdown,
            CONFIG_LIMITS.punctuationSlowdown.min / 100,
            CONFIG_LIMITS.punctuationSlowdown.max / 100,
        ),
        scaleLongWords: typeof source.scaleLongWords === "boolean" ? source.scaleLongWords : DEFAULT_CONFIG.scaleLongWords,
        blinkReminder: typeof source.blinkReminder === "boolean" ? source.blinkReminder : DEFAULT_CONFIG.blinkReminder,
    };
}

function normalizeHistoryEntry(raw: unknown): TextHistoryEntry | null {
    if (typeof raw !== "object" || raw === null || typeof (raw as { text?: unknown }).text !== "string") {
        return null;
    }

    const text = (raw as { text: string }).text.trim();
    if (!text) {
        return null;
    }

    const wordCount = parseTextToWords(text).length;
    const lastReadIndex = clampIndex((raw as { lastReadIndex?: unknown }).lastReadIndex, wordCount);
    const updatedAtCandidate = (raw as { updatedAt?: unknown }).updatedAt;
    const updatedAt = typeof updatedAtCandidate === "string" && !Number.isNaN(Date.parse(updatedAtCandidate))
        ? updatedAtCandidate
        : new Date().toISOString();

    return {
        id: hashText(text),
        text,
        title: buildTitle(text),
        preview: buildPreview(text),
        wordCount,
        updatedAt,
        lastReadIndex,
    };
}

export function createHistoryEntry(text: string, lastReadIndex = 0): TextHistoryEntry | null {
    return normalizeHistoryEntry({
        text,
        lastReadIndex,
        updatedAt: new Date().toISOString(),
    });
}

export function upsertHistoryEntry(history: TextHistoryEntry[], text: string, lastReadIndex = 0): {
    entry: TextHistoryEntry | null;
    history: TextHistoryEntry[];
} {
    const entry = createHistoryEntry(text, lastReadIndex);

    if (!entry) {
        return { entry: null, history };
    }

    return {
        entry,
        history: [entry, ...history.filter((item) => item.id !== entry.id)].slice(0, UI_CONSTANTS.HISTORY_LIMIT),
    };
}

export function loadPersistedReaderState(): PersistedReaderState {
    if (typeof window === "undefined") {
        return DEFAULT_PERSISTED_STATE;
    }

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return DEFAULT_PERSISTED_STATE;
        }

        const parsed = JSON.parse(raw) as Partial<PersistedReaderState>;
        const history = Array.isArray(parsed.history)
            ? parsed.history.map(normalizeHistoryEntry).filter((entry): entry is TextHistoryEntry => entry !== null)
            : [];

        return {
            settings: normalizeSettings(parsed.settings),
            currentText: typeof parsed.currentText === "string" ? parsed.currentText : "",
            currentHistoryId: typeof parsed.currentHistoryId === "string" ? parsed.currentHistoryId : null,
            lastReadIndex: typeof parsed.lastReadIndex === "number" ? Math.max(0, Math.round(parsed.lastReadIndex)) : 0,
            history,
        };
    } catch {
        return DEFAULT_PERSISTED_STATE;
    }
}

export function savePersistedReaderState(state: PersistedReaderState): void {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
