import { useEffect, useRef, useState, useCallback } from 'react';
import {
    RTCPeerConnection,
    RTCIceCandidate,
    RTCSessionDescription,
    mediaDevices,
    MediaStream,
} from 'react-native-webrtc';
import { useUser } from '../context/UserContext';
import { Socket } from 'socket.io-client';

const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
    ],
};

export const useWebRTC = (socket: Socket | null) => {
    const { user } = useUser();
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
    const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());

    const getLocalStream = useCallback(async () => {
        try {
            const stream = await mediaDevices.getUserMedia({
                audio: true,
                video: false,
            });
            setLocalStream(stream as MediaStream);
            return stream;
        } catch (error) {
            console.error('Error getting local stream:', error);
            return null;
        }
    }, []);

    const createPeerConnection = useCallback((targetId: string, stream: MediaStream | null) => {
        const pc = new RTCPeerConnection(configuration);

        if (stream) {
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
        }

        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                socket.emit('voice_candidate', {
                    target: targetId,
                    candidate: event.candidate,
                });
            }
        };

        pc.ontrack = (event) => {
            setRemoteStreams((prev) => {
                const newMap = new Map(prev);
                newMap.set(targetId, event.streams[0]);
                return newMap;
            });
        };

        peerConnections.current.set(targetId, pc);
        return pc;
    }, [socket]);

    useEffect(() => {
        if (!socket || !user) return;

        const handleOffer = async ({ sender, offer }: { sender: string; offer: RTCSessionDescription }) => {
            let pc = peerConnections.current.get(sender);
            if (!pc) {
                const stream = await getLocalStream(); // Ensure we have a stream to add?
                // Actually, we usually want to answer with our stream if we are also in the chat.
                // For now, let's assuming receiving connection creates it.
                pc = createPeerConnection(sender, localStream || stream);
            }

            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit('voice_answer', {
                target: sender,
                answer,
            });
        };

        const handleAnswer = async ({ sender, answer }: { sender: string; answer: RTCSessionDescription }) => {
            const pc = peerConnections.current.get(sender);
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            }
        };

        const handleCandidate = async ({ sender, candidate }: { sender: string; candidate: RTCIceCandidate }) => {
            const pc = peerConnections.current.get(sender);
            if (pc) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
        };

        socket.on('voice_offer', handleOffer);
        socket.on('voice_answer', handleAnswer);
        socket.on('voice_candidate', handleCandidate);

        return () => {
            socket.off('voice_offer', handleOffer);
            socket.off('voice_answer', handleAnswer);
            socket.off('voice_candidate', handleCandidate);
        };
    }, [socket, user, createPeerConnection, localStream, getLocalStream]);

    const connectToUser = async (targetId: string) => {
        if (!socket) return;

        // Ensure we have a stream
        let stream = localStream;
        if (!stream) {
            stream = await getLocalStream();
        }

        const pc = createPeerConnection(targetId, stream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('voice_offer', {
            target: targetId,
            offer,
        });
    };

    const toggleMute = (muted: boolean) => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !muted;
            });
        }
    };

    return {
        localStream,
        remoteStreams,
        connectToUser,
        toggleMute,
        getLocalStream
    };
};
