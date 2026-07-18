'use client';

import { useState, useEffect, useRef } from 'react';

interface CountdownTimerProps {
    endsAt: number | null;
    onEnd?: () => void;
    onWarning?: () => void;
    className?: string;
}

export function CountdownTimer({ endsAt, onEnd, onWarning, className = "" }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState(0);
    const hasTriggeredWarning = useRef(false);
    const hasTriggeredEnd = useRef(false);

    useEffect(() => {
        if (!endsAt) {
            setTimeLeft(0);
            hasTriggeredWarning.current = false;
            hasTriggeredEnd.current = false;
            return;
        }

        const updateTimer = () => {
            const now = Date.now();
            const diff = Math.max(0, endsAt - now);
            setTimeLeft(diff);

            const secondsLeft = Math.ceil(diff / 1000);

            if (secondsLeft <= 30 && secondsLeft > 0 && !hasTriggeredWarning.current) {
                hasTriggeredWarning.current = true;
                if (onWarning) onWarning();
            }

            if (diff === 0 && !hasTriggeredEnd.current) {
                hasTriggeredEnd.current = true;
                if (onEnd) onEnd();
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 100);

        return () => clearInterval(interval);
    }, [endsAt, onEnd, onWarning]);

    if (!endsAt) return null;

    const seconds = Math.ceil(timeLeft / 1000);

    if (seconds <= 0) {
        return <div className={`text-destructive font-mono ${className}`}>00:00</div>;
    }

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return (
        <div className={`font-mono tabular-nums tracking-tight ${className}`}>
            {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
        </div>
    );
}
