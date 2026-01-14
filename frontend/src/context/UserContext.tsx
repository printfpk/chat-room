import React, { createContext, useContext, useEffect, useState } from 'react';
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

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);

    useEffect(() => {
        const newSocket = io(SERVER_URL);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to socket server');
        });

        newSocket.on('users_update', (users: any[]) => {
            setOnlineUsers(users.filter(u => u.name !== user?.name));
        });

        return () => {
            newSocket.close();
        };
    }, []);

    useEffect(() => {
        checkUser();
    }, []);

    useEffect(() => {
        if (user && socket) {
            socket.emit('join', user);
        }
    }, [user, socket]);

    const checkUser = () => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            setIsLoginModalVisible(true);
        }
    };

    const login = async (name: string) => {
        if (!name.trim()) return;

        const newUser = {
            id: Date.now().toString(),
            name: name.trim(),
        };

        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
        setIsLoginModalVisible(false);
    };

    const logout = async () => {
        localStorage.removeItem('user');
        setUser(null);
        setIsLoginModalVisible(true);
    };

    const inviteUser = (userId: string, videoUrl: string) => {
        console.log(`Inviting user ${userId} to watch ${videoUrl}`);
        alert(`Invitation sent!`);
    };

    if (!user && !isLoginModalVisible) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
    }

    // Simple Login Modal Component
    const LoginModal = () => {
        const [name, setName] = useState('');

        if (!isLoginModalVisible && user) return null;

        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.8)',
                display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
            }}>
                <div style={{
                    backgroundColor: '#2a2a2a', padding: '2rem', borderRadius: '12px',
                    width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem'
                }}>
                    <h2 style={{ margin: 0 }}>Welcome!</h2>
                    <p style={{ color: '#aaa', margin: 0 }}>Enter your name to join</p>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your Name"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && login(name)}
                    />
                    <button
                        onClick={() => login(name)}
                        disabled={!name.trim()}
                    >
                        Start Watching
                    </button>
                </div>
            </div>
        );
    };

    return (
        <UserContext.Provider value={{ user, onlineUsers, login, logout, inviteUser, socket }}>
            {children}
            <LoginModal />
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
