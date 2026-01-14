import { useState, useRef } from 'react';
import { Play, Video as VideoIcon, AlertTriangle } from 'lucide-react';
import './VideoSection.css';

export default function VideoSection() {
    const [videoUrl, setVideoUrl] = useState('');
    const [inputUrl, setInputUrl] = useState('');
    const [error, setError] = useState('');
    const videoRef = useRef<HTMLVideoElement>(null);

    const handlePlay = () => {
        if (inputUrl) {
            let finalUrl = inputUrl;
            setError('');

            // Warn about localhost (less relevant on web if same machine, but still good to know if it's strictly local file without server)
            if (inputUrl.includes('localhost') || inputUrl.includes('127.0.0.1')) {
                console.warn('Localhost URLs might not be accessible if sharing.');
            }

            // Convert Google Drive Links
            if (inputUrl.includes('drive.google.com')) {
                const fileIdMatch = inputUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || inputUrl.match(/id=([a-zA-Z0-9_-]+)/);
                if (fileIdMatch && fileIdMatch[1]) {
                    finalUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
                }
            }
            // Convert Dropbox Links
            else if (inputUrl.includes('dropbox.com')) {
                try {
                    const url = new URL(inputUrl);
                    url.searchParams.set('raw', '1');
                    url.searchParams.delete('dl');
                    finalUrl = url.toString();
                } catch (e) {
                    console.warn("Could not parse Dropbox URL, using fallback.");
                    finalUrl = inputUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
                }
            }

            console.log("Playing URL:", finalUrl);
            setVideoUrl(finalUrl);
        }
    };

    return (
        <div className="video-section">
            <div className="input-container">
                <input
                    type="url"
                    placeholder="Enter Cloud Storage Video Link"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePlay()}
                />
                <button className="play-btn" onClick={handlePlay}>
                    <Play size={20} color="white" fill="white" />
                </button>
            </div>

            {videoUrl ? (
                <div className="video-wrapper">
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        controls
                        autoPlay
                        playsInline
                        {...{ referrerPolicy: "no-referrer" } as any}
                        onError={(e) => {
                            const err = e.currentTarget.error;
                            console.error("Video Error:", err);
                            setError(`Playback Error: ${err?.message || 'Format not supported or connection failed'}. (Code: ${err?.code})`);
                        }}
                        className="main-video"
                    />
                    {error && <div className="video-error"><AlertTriangle size={16} /> {error}</div>}
                </div>
            ) : (
                <div className="video-placeholder">
                    <VideoIcon size={64} color="#666" />
                    <p>No Video Loaded</p>
                </div>
            )}
        </div>
    );
}
