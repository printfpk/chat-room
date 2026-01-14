import { useState, useEffect, useCallback } from 'react';
import VideoSection from './components/VideoSection';
import CommentSection from './components/CommentSection';
import VoiceSeats from './components/VoiceSeats';
import ReactionOverlay from './components/ReactionOverlay';
import { UserProvider, useUser } from './context/UserContext';
import './App.css';

const DIALOGUE_MAP: Record<string, string> = {
  '❤️': 'Wah! Kya scene hai!',
  '😂': 'Arrey bhai bhai bhai!',
  '😮': 'Oh teri! Ye kya tha?',
  '🔥': 'Maza aa gaya!',
  '🎉': 'Party shuru kijiye!',
};

function Content() {
  const { socket } = useUser();
  const [reactions, setReactions] = useState<{ id: string, emoji: string, startX: number }[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveReaction = (reaction: { emoji: string, startX: number }) => {
      triggerReaction(reaction.emoji, reaction.startX);
    };

    socket.on('receive_reaction', handleReceiveReaction);
    return () => {
      socket.off('receive_reaction', handleReceiveReaction);
    };
  }, [socket]);

  const triggerReaction = (emoji: string, startX: number) => {
    // Speech Synthesis
    const textToSpeak = DIALOGUE_MAP[emoji];
    if (textToSpeak && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'hi-IN'; // Hind-India
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }

    setReactions(prev => [...prev, { id: Date.now() + Math.random().toString(), emoji, startX }]);
  };

  const handleAnimationComplete = (id: string) => {
    setReactions(prev => prev.filter(r => r.id !== id));
  };

  const handleReaction = useCallback((emoji: string) => {
    const startX = Math.random() * 100; // Mock position
    if (socket) {
      socket.emit('send_reaction', { emoji, startX });
    } else {
      triggerReaction(emoji, startX);
    }
  }, [socket]);

  return (
    <div className="app-container">
      <ReactionOverlay reactions={reactions} onAnimationComplete={handleAnimationComplete} />
      <header className="app-header">
        <h1>Watch Party</h1>
      </header>
      <div className="main-layout">
        <div className="video-area">
          <VideoSection />
          <VoiceSeats />
        </div>
        <div className="sidebar">
          <CommentSection onReaction={handleReaction} />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <Content />
    </UserProvider>
  )
}
