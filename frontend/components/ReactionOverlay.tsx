import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay,
    Easing,
    runOnJS
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Reaction {
    id: string;
    emoji: string;
    startX: number;
}

interface ReactionOverlayProps {
    reactions: Reaction[];
    onAnimationComplete: (id: string) => void;
}

const FloatingEmoji = ({ emoji, onComplete, startX }: { emoji: string; onComplete: () => void; startX: number }) => {
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(1);
    const scale = useSharedValue(0.5);
    const translateX = useSharedValue(0);

    useEffect(() => {
        // Randomize the path slightly
        const randomX = Math.random() * 40 - 20; // -20 to 20

        scale.value = withTiming(1.5, { duration: 400 });

        translateX.value = withSequence(
            withTiming(randomX, { duration: 1000 }),
            withTiming(-randomX, { duration: 1000 })
        );

        translateY.value = withSequence(
            withTiming(-SCREEN_HEIGHT * 0.4, { duration: 1500, easing: Easing.out(Easing.ease) }),
            withTiming(-SCREEN_HEIGHT * 0.6, { duration: 1000 }, (finished) => {
                if (finished) {
                    runOnJS(onComplete)();
                }
            })
        );

        opacity.value = withSequence(
            withTiming(1, { duration: 200 }),
            withDelay(1000, withTiming(0, { duration: 1000 }))
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: translateY.value },
                { translateX: translateX.value },
                { scale: scale.value }
            ],
            opacity: opacity.value
        };
    });

    return (
        <Animated.Text style={[styles.emoji, animatedStyle, { left: startX }]}>
            {emoji}
        </Animated.Text>
    );
};

export default function ReactionOverlay({ reactions, onAnimationComplete }: ReactionOverlayProps) {
    return (
        <View style={styles.container} pointerEvents="none">
            {reactions.map((r) => (
                <FloatingEmoji
                    key={r.id}
                    emoji={r.emoji}
                    startX={r.startX}
                    onComplete={() => onAnimationComplete(r.id)}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
        justifyContent: 'flex-end',
        elevation: 1000,
    },
    emoji: {
        position: 'absolute',
        fontSize: 30,
        bottom: 100, // Start just above the input area
    }
});
