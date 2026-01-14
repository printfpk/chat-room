import React, { useEffect, useMemo } from 'react';
import './ReactionOverlay.css';

interface Reaction {
    id: string;
    emoji: string;
    startX: number;
}

export default function ReactionOverlay({ reactions, onAnimationComplete }: { reactions: Reaction[], onAnimationComplete: (id: string) => void }) {
    return (
        <div className="reaction-overlay">
            {reactions.map(r => (
                <FloatingEmoji
                    key={r.id}
                    reaction={r}
                    onComplete={() => onAnimationComplete(r.id)}
                />
            ))}
        </div>
    );
}

const FloatingEmoji = ({ reaction, onComplete }: { reaction: Reaction, onComplete: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onComplete, 2000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    // Use usage of startX if you want consistency, but here randomizing for Web aspect ratio.
    const left = useMemo(() => Math.floor(Math.random() * 80) + 10 + '%', []);

    return (
        <div className="floating-emoji" style={{ left }}>
            {reaction.emoji}
        </div>
    );
};
