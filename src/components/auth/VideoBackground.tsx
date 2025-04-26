
import React, { useEffect, useState } from 'react';

interface VideoBackgroundProps {
  videoUrl: string;
}

const VideoBackground = ({ videoUrl }: VideoBackgroundProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.onloadeddata = () => setIsLoaded(true);
  }, [videoUrl]);

  if (!isLoaded) {
    return <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent/50" />;
  }

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute min-h-full min-w-full object-cover"
      >
        <source src={videoUrl} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );
};

export default VideoBackground;
