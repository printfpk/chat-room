import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { SERVER_URL } from '../constants/Config';

interface User {
  id: string;
  name: string;
}

interface UserContextType {
  user: User | null;
  onlineUsers: User[];
  login: (name: string) => Promise<void>;
  logout: () => Promise<void>;
  inviteUser: (userId: string, videoUrl: string) => void;
  socket: Socket | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Mock online users service (In a real app, this would use WebSockets/Socket.io)
const MOCK_ONLINE_USERS: User[] = [];

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [tempName, setTempName] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
    });

    newSocket.on('users_update', (users: any[]) => {
      setOnlineUsers(users.filter(u => u.name !== user?.name)); // Filter self if needed, or by ID
    });

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user && socket) {
      socket.emit('join', user);
    }
  }, [user, socket]);

  const checkUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setIsLoginModalVisible(true);
      }
    } catch (e) {
      console.error(e);
      setIsLoginModalVisible(true);
    }
  };

  const login = async (name: string) => {
    if (!name.trim()) return;

    const newUser = {
      id: Date.now().toString(),
      name: name.trim(),
    };

    try {
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      setIsLoginModalVisible(false);
    } catch (e) {
      console.error(e);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
      setIsLoginModalVisible(true);
    } catch (e) {
      console.error(e);
    }
  };

  const inviteUser = (userId: string, videoUrl: string) => {
    console.log(`Inviting user ${userId} to watch ${videoUrl}`);
    // In a real app, emit a socket event here
    alert(`Invitation sent!`);
  };

  if (!user && !isLoginModalVisible) {
    return null; // Or a splash screen
  }

  return (
    <UserContext.Provider value={{ user, onlineUsers, login, logout, inviteUser, socket }}>
      {children}
      <Modal visible={isLoginModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Welcome!</Text>
            <Text style={styles.subtitle}>Enter your name to join</Text>
            <TextInput
              style={styles.input}
              placeholder="Your Name"
              value={tempName}
              onChangeText={setTempName}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.button, !tempName.trim() && styles.disabledButton]}
              onPress={() => login(tempName)}
              disabled={!tempName.trim()}
            >
              <Text style={styles.buttonText}>Start Watching</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
