"use client";

interface SettingItemProps {
    label: string;
    value: number;
    unit: string;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
}

export function SettingItem({
    label,
    value,
    unit,
    onChange,
    min,
    max,
    step = 1
}: SettingItemProps) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-zinc-500 tracking-wider">
                    {label}
                </span>
                <span className="text-sm font-mono text-white">
                    {value}
                    <span className="text-[10px] text-zinc-600 ml-1">{unit}</span>
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="w-full accent-red-500 h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer"
            />
        </div>
    );
}

interface SettingToggleProps {
    label: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}

export function SettingToggle({ label, checked, onChange }: SettingToggleProps) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-zinc-500 tracking-wider">
                {label}
            </span>
            <button
                onClick={() => onChange(!checked)}
                className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-red-500" : "bg-zinc-700"}`}
            >
                <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${checked ? "left-5" : "left-0.5"}`}
                />
            </button>
        </div>
    );
}
