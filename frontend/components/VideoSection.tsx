import { Ionicons } from '@expo/vector-icons';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';

export default function VideoSection() {
  const [videoUrl, setVideoUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [status, setStatus] = useState<AVPlaybackStatus>({} as AVPlaybackStatus);
  const video = React.useRef<Video>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handlePlay = () => {
    if (inputUrl) {
      let finalUrl = inputUrl;

      // Warn about localhost
      if (inputUrl.includes('localhost') || inputUrl.includes('127.0.0.1')) {
         console.warn('Using "localhost" or "127.0.0.1" may not work on a real mobile device.');
      }
      
      // Convert Google Drive Links to Direct Stream Links
      if (inputUrl.includes('drive.google.com')) {
        const fileIdMatch = inputUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || inputUrl.match(/id=([a-zA-Z0-9_-]+)/);
        if (fileIdMatch && fileIdMatch[1]) {
           finalUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
        }
      } 
      // Convert Dropbox Links
      else if (inputUrl.includes('dropbox.com')) {
         finalUrl = inputUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
      }

      console.log("Playing URL:", finalUrl);
      setVideoUrl(finalUrl);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { color: isDark ? '#fff' : '#000', borderColor: isDark ? '#444' : '#ccc', backgroundColor: isDark ? '#333' : '#fff' }]}
          placeholder="Enter Cloud Storage Video Link"
          placeholderTextColor={isDark ? '#aaa' : '#666'}
          value={inputUrl}
          onChangeText={setInputUrl}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Video URL Input"
          accessibilityHint="Enter the URL of the video you want to play"
        />
        <TouchableOpacity 
          style={styles.playButton} 
          onPress={handlePlay}
          accessibilityRole="button"
          accessibilityLabel="Play Video"
          accessibilityHint="Loads and plays the video from the entered URL"
        >
           <Ionicons name="play" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {videoUrl ? (
        <Video
          ref={video}
          style={styles.video}
          source={{
            uri: videoUrl,
          }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping
          onError={(e) => console.warn("Video Error:", e)}
          onPlaybackStatusUpdate={status => setStatus(() => status)}
        />
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="videocam-outline" size={64} color={isDark ? '#444' : '#ccc'} />
          <Text style={{ color: isDark ? '#666' : '#999', marginTop: 10 }}>No Video Loaded</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    width: '100%',
    padding: 10,
    gap: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
  },
  playButton: {
    backgroundColor: '#007AFF',
    width: 45,
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: 220,
    backgroundColor: 'black',
  },
  placeholder: {
    width: '100%',
    height: 220,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
