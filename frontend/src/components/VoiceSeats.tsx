import React, { useEffect, useState, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { useWebRTC } from '../hooks/useWebRTC';
import { Mic, MicOff, UserPlus, X } from 'lucide-react';
import './VoiceSeats.css';

const AudioStream = ({ stream }: { stream: MediaStream }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    useEffect(() => {
        if (audioRef.current) {
            console.log("Setting stream to audio element", stream);
            audioRef.current.srcObject = stream;
        }
    }, [stream]);
    return <audio ref={audioRef} autoPlay />;
};

const Seat = ({ id, isActive, onPress, name, isSelf }: { id: string | number, isActive: boolean, onPress: () => void, name: string, isSelf: boolean }) => {
    return (
        <div className="seat-container">
            <div className="ring-container">
                {isActive && <div className="ring pulsing-ring" />}
                <button
                    className={`seat-avatar ${isSelf ? 'is-self' : ''}`}
                    onClick={onPress}
                    title={name}
                >
                    {name !== 'Empty' ? (
                        <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`}
                            alt={name}
                            className="avatar-img"
                        />
                    ) : (
                        isActive ? <Mic size={24} color="#4CAF50" /> : <MicOff size={24} color="#666" />
                    )}
                </button>
            </div>
            <span className="seat-name" title={name}>{name} {isSelf ? '(You)' : ''}</span>
        </div>
    );
};

export default function VoiceSeats() {
    const { user, onlineUsers, inviteUser, socket } = useUser();
    const [activeSeat, setActiveSeat] = useState<string | number | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);

    const { remoteStreams, connectToUser, toggleMute, getLocalStream } = useWebRTC(socket);

    const seats = [
        { id: user?.id || 'self', name: user?.name || 'You', isSelf: true },
        ...(user ? onlineUsers.slice(0, 3).map(u => ({ id: u.id, name: u.name, isSelf: false })) : [])
    ];

    while (seats.length < 4) {
        seats.push({ id: `empty-${seats.length}`, name: 'Empty', isSelf: false });
    }

    const handleSeatPress = async (id: string | number, name: string) => {
        if (name === 'Empty') {
            setShowInviteModal(true);
            return;
        }

        if (id === user?.id || id === 'self') {
            const isActive = activeSeat === id;
            if (isActive) {
                setActiveSeat(null);
                toggleMute(true);
            } else {
                setActiveSeat(id);
                await getLocalStream();
                toggleMute(false);

                onlineUsers.forEach(u => {
                    connectToUser(u.id);
                });
            }
        } else {
            console.log("Clicked other user");
        }
    };

    const handleInvite = (userId: string) => {
        inviteUser(userId, window.location.href);
        setShowInviteModal(false);
    };

    return (
        <div className="voice-seats-section">
            <div className="voice-header">
                <h3>Voice Chat</h3>
                <button onClick={() => setShowInviteModal(true)} className="invite-icon-btn">
                    <UserPlus size={20} />
                </button>
            </div>

            <div className="seats-grid">
                {seats.map((seat) => (
                    <Seat
                        key={seat.id}
                        id={seat.id}
                        name={seat.name}
                        isSelf={seat.isSelf}
                        isActive={activeSeat === seat.id}
                        onPress={() => handleSeatPress(seat.id, seat.name)}
                    />
                ))}
            </div>

            {Array.from(remoteStreams.entries()).map(([id, stream]) => (
                <AudioStream key={id} stream={stream} />
            ))}

            {showInviteModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Invite Friends</h3>
                            <button onClick={() => setShowInviteModal(false)}><X size={24} /></button>
                        </div>
                        <p className="online-count">{onlineUsers.length} users online</p>

                        <div className="users-list">
                            {onlineUsers.length === 0 ? (
                                <p className="no-users">No other users online right now.</p>
                            ) : (
                                onlineUsers.map(u => (
                                    <div key={u.id} className="user-row">
                                        <div className="user-info">
                                            <div className="avatar-small">{u.name[0]}</div>
                                            <div>
                                                <div className="u-name">{u.name}</div>
                                                <div className="u-status">● Online</div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleInvite(u.id)} className="invite-btn">Invite</button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
