import CommentSection from '@/components/CommentSection';
import VideoSection from '@/components/VideoSection';
import VoiceSeats from '@/components/VoiceSeats';
import ReactionOverlay from '@/components/ReactionOverlay';
import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { useUser } from '@/context/UserContext';

export default function HomeScreen() {
  const [reactions, setReactions] = useState<{ id: string, emoji: string, startX: number }[]>([]);

  const DIALOGUE_MAP: Record<string, string> = {
    '❤️': 'Wah! Kya scene hai!',
    '😂': 'Arrey bhai bhai bhai!',
    '😮': 'Oh teri! Ye kya tha?',
    '🔥': 'Maza aa gaya!',
    '🎉': 'Party shuru kijiye!',
  };


  const { socket } = useUser();

  // Listen for incoming reactions
  useEffect(() => {
    if (!socket) return;

    socket.on('receive_reaction', (reaction: { emoji: string, startX: number }) => {
      triggerReaction(reaction.emoji, reaction.startX);
    });

    return () => {
      socket.off('receive_reaction');
    };
  }, [socket]);

  const triggerReaction = (emoji: string, startX: number) => {
    // Speak based on emoji
    const textToSpeak = DIALOGUE_MAP[emoji];
    if (textToSpeak) {
      Speech.speak(textToSpeak, {
        language: 'hi-IN',
        pitch: 1.1,
        rate: 1.0,
      });
    }

    const id = Date.now().toString() + Math.random();
    setReactions(prev => [...prev, { id, emoji, startX }]);
  };
  const handleReaction = useCallback((emoji: string) => {
    // Random start position near the middle-right
    const startX = Math.random() * 100 + 200;

    // Trigger local immediately
    // triggerReaction(emoji, startX); 
    // Actually, getting it back from server ensures sync, but local lag is bad.
    // Let's trigger local + emit. 
    // BUT if we listen to 'receive', we will get it back. 
    // To avoid echo, we can distinguish IDs or just not adding it local if we trust latency.
    // For smooth UI, add local, emit to others.
    // The server code broadcasts to ALL. So we will get duplicate if we add local.
    // Let's just emit and wait for loopback? Minimal lag on LAN.

    if (socket) {
      socket.emit('send_reaction', { emoji, startX });
    } else {
      // Offline fallback
      triggerReaction(emoji, startX);
    }
  }, [socket]);

  const handleAnimationComplete = useCallback((id: string) => {
    setReactions(prev => prev.filter(r => r.id !== id));
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ReactionOverlay reactions={reactions} onAnimationComplete={handleAnimationComplete} />
      <View style={styles.content}>
        <VideoSection />
        <VoiceSeats />
        <CommentSection onReaction={handleReaction} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
  },
});
