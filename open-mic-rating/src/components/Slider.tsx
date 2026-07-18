'use client';

import { motion } from 'framer-motion';

interface SliderProps {
    value: number;
    onChange: (val: number) => void;
    disabled?: boolean;
}

export function RateSlider({ value, onChange, disabled = false }: SliderProps) {
    const marks = Array.from({ length: 10 }, (_, i) => i + 1);

    return (
        <div className="w-full relative flex flex-col items-center gap-6 mt-8">
            <div className="text-6xl font-semibold tabular-nums text-primary">{value}</div>
            <div className="w-full relative h-12 bg-muted rounded-2xl overflow-hidden cursor-pointer touch-none">

                {/* Animated Fill Background */}
                <motion.div
                    className="absolute top-0 left-0 h-full bg-primary/10 rounded-2xl"
                    initial={{ width: `${(value / 10) * 100}%` }}
                    animate={{ width: `${(value / 10) * 100}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />

                {/* Native Input Range Overlay */}
                <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value))}
                    disabled={disabled}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />

                {/* Floating Tick Marks */}
                <div className="absolute inset-0 flex justify-between items-center px-4 pointer-events-none">
                    {marks.map((m) => (
                        <div
                            key={m}
                            className={`text-sm font-medium transition-colors ${value >= m ? 'text-primary' : 'text-muted-foreground'}`}
                        >
                            {m}
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex justify-between w-full px-2 text-sm text-muted-foreground font-medium">
                <span>Poor (1)</span>
                <span>Excellent (10)</span>
            </div>
        </div>
    );
}
