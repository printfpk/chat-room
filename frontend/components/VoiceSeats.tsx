import { useUser } from '@/context/UserContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View, Image } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { RTCView } from 'react-native-webrtc';
import { useWebRTC } from '@/hooks/useWebRTC';

const Seat = ({ id, isActive, onPress, name, isSelf }: { id: string | number, isActive: boolean, onPress: () => void, name: string, isSelf: boolean }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.3);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    if (isActive) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 800 }),
          withTiming(0.3, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      scale.value = withTiming(1);
      opacity.value = withTiming(0.3);
    }
  }, [isActive]);

  const animatedRingStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <View style={styles.seatContainer}>
      <View style={styles.ringContainer}>
        {isActive && (
          <Animated.View style={[styles.ring, animatedRingStyle, { backgroundColor: '#4CAF50' }]} />
        )}
        <TouchableOpacity
          style={[styles.avatar, { backgroundColor: isDark ? '#444' : '#fff', borderColor: isSelf ? '#007AFF' : 'transparent', borderWidth: isSelf ? 2 : 0, overflow: 'hidden' }]}
          onPress={onPress}
          activeOpacity={0.8}
          onLongPress={onPress}
        >
          {name !== 'Empty' ? (
            <Image
              source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random` }}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <MaterialCommunityIcons
              name={isActive ? "microphone" : "microphone-off"}
              size={24}
              color={isActive ? "#4CAF50" : (isDark ? "#aaa" : "#666")}
            />
          )}
        </TouchableOpacity>
      </View>
      <Text style={[styles.name, { color: isDark ? '#ddd' : '#333' }]} numberOfLines={1}>{name} {isSelf ? '(You)' : ''}</Text>
    </View>
  );
};

export default function VoiceSeats() {
  const { user, onlineUsers, inviteUser, socket } = useUser();
  const [activeSeat, setActiveSeat] = useState<string | number | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { remoteStreams, connectToUser, toggleMute, getLocalStream } = useWebRTC(socket);

  const seats = [
    { id: user?.id || 'self', name: user?.name || 'You', isSelf: true },
    ...(user ? onlineUsers.slice(0, 3).map(u => ({ id: u.id, name: u.name, isSelf: false })) : [])
  ];

  // Fill remaining slots up to 4
  while (seats.length < 4) {
    seats.push({ id: `empty-${seats.length}`, name: 'Empty', isSelf: false });
  }

  const handleSeatPress = async (id: string | number, name: string) => {
    if (name === 'Empty') {
      setShowInviteModal(true);
      return;
    }

    // Logic for Self Seat
    if (id === user?.id || id === 'self') {
      const isActive = activeSeat === id;
      if (isActive) {
        // Turning OFF
        setActiveSeat(null);
        toggleMute(true);
      } else {
        // Turning ON
        setActiveSeat(id);
        await getLocalStream(); // Ensure we have stream
        toggleMute(false);

        // Connect to all online users
        onlineUsers.forEach(u => {
          connectToUser(u.id);
        });
      }
    } else {
      // Clicking on someone else usually doesn't do anything in this simplified UI
      // Maybe mute them locally?
      console.log("Clicked other user");
    }
  };

  const handleInvite = (userId: string) => {
    inviteUser(userId, 'current-video-url'); // You'd pass the actual video URL here
    setShowInviteModal(false);
  };

  return (
    <View style={styles.container}>
      {/* Hidden RTC Views for Audio Playback */}
      <View style={{ height: 0, width: 0, overflow: 'hidden' }}>
        {Array.from(remoteStreams.entries()).map(([id, stream]) => (
          <RTCView key={id} streamURL={stream.toURL()} style={{ width: 0, height: 0 }} mirror={false} objectFit="cover" />
        ))}
      </View>

      <View style={styles.headerContainer}>
        <Text style={styles.header}>Voice Chat</Text>
        <TouchableOpacity onPress={() => setShowInviteModal(true)} style={styles.inviteHeaderBtn}>
          <Ionicons name="person-add" size={20} color={isDark ? '#fff' : '#007AFF'} />
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {seats.map((seat) => (
          <Seat
            key={seat.id}
            id={seat.id}
            name={seat.name}
            isSelf={seat.isSelf}
            isActive={activeSeat === seat.id} // Note: This only reflects SELF active status mostly, for others we might need to listen to 'speaking' events. For now, simplistic.
            onPress={() => handleSeatPress(seat.id, seat.name)}
          />
        ))}
      </View>

      <Modal animationType="slide" transparent visible={showInviteModal} onRequestClose={() => setShowInviteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFF' : '#000' }]}>Invite Friends</Text>
              <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                <Ionicons name="close" size={24} color={isDark ? '#FFF' : '#000'} />
              </TouchableOpacity>
            </View>
            <Text style={{ color: isDark ? '#BBB' : '#666', marginBottom: 15 }}>{onlineUsers.length} users online now</Text>

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              {onlineUsers.length === 0 ? (
                <Text style={{ textAlign: 'center', color: isDark ? '#666' : '#999', marginTop: 20 }}>No other users online right now.</Text>
              ) : (
                onlineUsers.map(u => (
                  <View key={u.id} style={[styles.userRow, { borderColor: isDark ? '#333' : '#eee' }]}>
                    <View style={styles.userInfo}>
                      <View style={[styles.userAvatar, { backgroundColor: isDark ? '#333' : '#eee' }]}>
                        <Text style={{ color: isDark ? '#FFF' : '#000' }}>{u.name[0]}</Text>
                      </View>
                      <View>
                        <Text style={[styles.userName, { color: isDark ? '#FFF' : '#000' }]}>{u.name}</Text>
                        <Text style={{ fontSize: 12, color: '#4CAF50' }}>● Online</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.inviteBtn}
                      onPress={() => handleInvite(u.id)}
                    >
                      <Text style={styles.inviteBtnText}>Invite</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  inviteHeaderBtn: {
    padding: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  seatContainer: {
    width: '22%',
    alignItems: 'center',
    marginBottom: 15,
  },
  ringContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  ring: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  name: {
    fontSize: 12,
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '60%',
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  userName: {
    fontWeight: '600',
    fontSize: 16,
  },
  inviteBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  inviteBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});
