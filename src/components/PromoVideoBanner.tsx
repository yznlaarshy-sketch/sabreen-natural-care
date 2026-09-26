import React, { useRef, useState } from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { PromoVideo } from '../types';

interface PromoVideoBannerProps {
  video: PromoVideo | null | undefined;
}

// Converts a YouTube watch/short/share link into an embeddable URL with
// autoplay + mute enabled (required for autoplay to work on any browser).
function getYouTubeEmbedUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{6,})/,
    /(?:youtu\.be\/)([\w-]{6,})/,
    /(?:youtube\.com\/shorts\/)([\w-]{6,})/,
    /(?:youtube\.com\/embed\/)([\w-]{6,})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&loop=1&playlist=${match[1]}&playsinline=1&controls=1&rel=0`;
    }
  }
  return null;
}

export const PromoVideoBanner: React.FC<PromoVideoBannerProps> = ({ video }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  if (!video || !video.enabled || !video.url) return null;

  const youtubeEmbedUrl = video.sourceType === 'link' ? getYouTubeEmbedUrl(video.url) : null;
  const isDirectVideoFile = video.sourceType === 'upload' || !youtubeEmbedUrl;

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <div className="container mx-auto px-4 max-w-7xl -mt-2 mb-10">
      <div className="relative w-full rounded-3xl overflow-hidden bg-black border border-[#D4AF37]/25 shadow-2xl">
        {video.badgeText && (
          <span className="absolute top-4 right-4 z-20 inline-flex items-center gap-1.5 bg-[#D4AF37] text-[#0E0E10] text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
            <Sparkles className="w-3.5 h-3.5" />
            {video.badgeText}
          </span>
        )}

        {video.title && (
          <div className="absolute top-5 left-5 z-20 max-w-[65%] pointer-events-none">
            <h3 className="text-[#FAF7F2] font-extrabold text-lg sm:text-2xl leading-snug font-serif-luxury drop-shadow-lg">
              {video.title}
            </h3>
          </div>
        )}

        {isDirectVideoFile ? (
          <video
            ref={videoRef}
            src={video.url}
            autoPlay
            muted
            loop
            playsInline
            controls
            preload="metadata"
            className="w-full max-h-[70vh] object-cover"
          >
            متصفحك لا يدعم تشغيل الفيديو مباشرة، يمكنك تحميله من هذا الرابط.
          </video>
        ) : (
          <div className="relative w-full aspect-video">
            <iframe
              src={youtubeEmbedUrl!}
              title={video.title || 'فيديو إعلاني'}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {isDirectVideoFile && (
          <button
            onClick={toggleMute}
            className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 bg-black/60 hover:bg-black/80 text-[#FAF7F2] text-xs font-semibold px-3 py-2 rounded-full backdrop-blur-sm transition-colors"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
