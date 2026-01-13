import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { FlatList, Animated as RNAnimated, StyleSheet, Text, TouchableOpacity, useColorScheme, View, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useUser } from '@/context/UserContext';
import { Swipeable } from 'react-native-gesture-handler';

const initialComments: { id: string; user: string; text: string; time: string }[] = [];

const CommentItem = ({ item, isDark, onReply }: { item: any, isDark: boolean, onReply: (item: any) => void }) => {
  const renderLeftActions = (progress: any, dragX: any) => {
    const trans = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [-20, 0],
    });

    return (
      <View style={styles.leftActionContainer}>
        <RNAnimated.View style={[styles.leftAction, { transform: [{ translateX: trans }] }]}>
          <TouchableOpacity style={styles.actionButton} onPress={() => onReply(item)}>
            <MaterialIcons name="reply" size={24} color="white" />
            <Text style={styles.actionText}>Reply</Text>
          </TouchableOpacity>
        </RNAnimated.View>
      </View>
    );
  };

  return (
    <Swipeable renderLeftActions={renderLeftActions}>
      <View style={[styles.commentCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderBottomColor: isDark ? '#333' : '#f0f0f0' }]}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{item.user[0]}</Text>
        </View>
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={[styles.userName, { color: isDark ? '#FFF' : '#000' }]}>{item.user}</Text>
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
          <Text style={[styles.commentText, { color: isDark ? '#CCC' : '#333' }]}>{item.text}</Text>
        </View>
      </View>
    </Swipeable>
  );
};

export default function CommentSection({ onReaction }: { onReaction?: (emoji: string) => void }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { socket, user } = useUser();

  const [inputText, setInputText] = useState('');
  const [comments, setComments] = useState(initialComments);
  const [showReactions, setShowReactions] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const inputRef = React.useRef<TextInput>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('receive_comment', (comment: any) => {
      setComments(prev => [...prev, comment]);
    });

    return () => {
      socket.off('receive_comment');
    };
  }, [socket]);

  const REACTIONS = ['❤️', '😂', '😮', '🔥', '🎉'];

  const handleReactionPress = (emoji: string) => {
    if (onReaction) {
      onReaction(emoji);
    }
    // Optional: close after selection? 
    // setShowReactions(false); 
  };


  const handleReply = (item: any) => {
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

      // Emit to server
      if (socket) {
        // Optimistic update handled by listening to own echo? 
        // Or we can add it local instantly. 
        // For simplicity let's rely on server echo for ordering, 
        // OR add local and server will send it back (might duplicate if not careful).
        // Since the server code emits to everyone including sender: "io.emit('receive_comment', comment)"
        // We will receive our own message back. So we just emit here.
        socket.emit('send_comment', newComment);
      } else {
        // Fallback for offline/no backend
        setComments(prev => [...prev, newComment]);
      }

      setInputText('');
      setReplyingTo(null);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >

      <FlatList
        data={comments}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <CommentItem item={item} isDark={isDark} onReply={handleReply} />}
        contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 16 }}
        style={{ flex: 1 }}
      />
      <View style={[styles.inputContainer, { backgroundColor: 'transparent', borderTopWidth: 0 }]}>
        {showReactions && (
          <View style={[styles.reactionBar, { backgroundColor: isDark ? '#333' : '#fff', borderColor: isDark ? '#444' : '#eee' }]}>
            {REACTIONS.map(emoji => (
              <TouchableOpacity key={emoji} onPress={() => handleReactionPress(emoji)} style={styles.reactionBtn}>
                <Text style={{ fontSize: 24 }}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {replyingTo && (
          <View style={[styles.replyBar, { backgroundColor: isDark ? '#333' : '#e6f0ff', borderColor: isDark ? '#444' : '#cce0ff' }]}>
            <Text style={{ color: isDark ? '#ccc' : '#666' }}>Replying to <Text style={{ fontWeight: 'bold' }}>{replyingTo.user}</Text></Text>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <MaterialIcons name="close" size={20} color={isDark ? '#aaa' : '#666'} />
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity style={styles.iconButton} onPress={() => setShowReactions(!showReactions)}>
          <MaterialIcons name={showReactions ? "close" : "sentiment-satisfied-alt"} size={26} color={isDark ? "#AAA" : "#666"} />
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: isDark ? '#FFF' : '#000', backgroundColor: isDark ? '#333' : '#FFF' }]}
          placeholder="Type a message..."
          placeholderTextColor={isDark ? '#AAA' : '#888'}
          value={inputText}
          onChangeText={setInputText}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={true}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <MaterialIcons name="send" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  commentCard: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  commentContent: {
    flex: 1,
    justifyContent: 'center',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: {
    fontWeight: '600',
    fontSize: 14,
  },
  timeText: {
    color: '#999',
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
  },
  leftActionContainer: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftAction: {
    flex: 1,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  actionButton: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50'
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  iconButton: {
    padding: 5,
  },
  reactionBar: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    flexDirection: 'row',
    padding: 8,
    borderRadius: 25,
    gap: 15,
    borderWidth: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  reactionBtn: {
    padding: 4,
  },
  replyBar: {
    position: 'absolute',
    bottom: 50, // Above input
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    padding: 8,
  }
});
