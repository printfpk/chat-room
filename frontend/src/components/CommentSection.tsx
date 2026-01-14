import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { Send, Reply, X, Smile } from 'lucide-react';
import './CommentSection.css';

interface Comment {
    id: string;
    user: string;
    text: string;
    time: string;
}

const initialComments: Comment[] = [];

export default function CommentSection({ onReaction }: { onReaction?: (emoji: string) => void }) {
    const { socket, user } = useUser();
    const [inputText, setInputText] = useState('');
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [showReactions, setShowReactions] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const commentsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!socket) return;

        socket.on('receive_comment', (comment: Comment) => {
            setComments(prev => [...prev, comment]);
            // Auto scroll to bottom
            setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });

        return () => {
            socket.off('receive_comment');
        };
    }, [socket]);

    const REACTIONS = ['❤️', '😂', '😮', '🔥', '🎉'];

    const handleReactionPress = (emoji: string) => {
        if (onReaction) onReaction(emoji);
    };

    const handleReply = (item: Comment) => {
        setReplyingTo(item);
        inputRef.current?.focus();
    };

    const handleSend = () => {
        if (inputText.trim()) {
            const text = replyingTo ? `@${replyingTo.user} ${inputText.trim()}` : inputText.trim();
            const newComment = {
                id: Date.now().toString(),
                user: user?.name || 'Guest',
                text: text,
                time: 'Just now'
            };

            if (socket) {
                socket.emit('send_comment', newComment);
            } else {
                setComments(prev => [...prev, newComment]);
                setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }

            setInputText('');
            setReplyingTo(null);
        }
    };

    return (
        <div className="comment-section">
            <div className="comments-list">
                {comments.map((item) => (
                    <div key={item.id} className="comment-card">
                        <div className="avatar-placeholder">{item.user[0]}</div>
                        <div className="comment-content">
                            <div className="comment-header">
                                <span className="user-name">{item.user}</span>
                                <span className="time-text">{item.time}</span>
                            </div>
                            <p className="comment-text">{item.text}</p>
                        </div>
                        <button className="reply-btn-small" onClick={() => handleReply(item)} title="Reply">
                            <Reply size={16} />
                        </button>
                    </div>
                ))}
                <div ref={commentsEndRef} />
            </div>

            <div className="input-area">
                {showReactions && (
                    <div className="reaction-bar">
                        {REACTIONS.map(emoji => (
                            <button key={emoji} onClick={() => handleReactionPress(emoji)} className="reaction-btn">
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}

                {replyingTo && (
                    <div className="reply-bar">
                        <span>Replying to <strong>{replyingTo.user}</strong></span>
                        <button onClick={() => setReplyingTo(null)} className="close-reply"><X size={14} /></button>
                    </div>
                )}

                <div className="input-wrapper">
                    <button className="icon-btn" onClick={() => setShowReactions(!showReactions)}>
                        {showReactions ? <X size={20} /> : <Smile size={20} />}
                    </button>
                    <input
                        ref={inputRef}
                        placeholder="Type a message..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button className="send-btn" onClick={handleSend}>
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
