
import { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';

interface InteractiveLogoProps {
  src: string;
  alt: string;
  className?: string;
}

const InteractiveLogo = ({ src, alt, className = "" }: InteractiveLogoProps) => {
  const [sparkle, setSparkle] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Create audio element but don't autoplay
    const audioElement = new Audio("https://example.com/chime.mp3");
    setAudio(audioElement);
    
    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);

  const handleClick = () => {
    setSparkle(true);
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => 
    }
    
    // Reset sparkle animation after it completes
    setTimeout(() => setSparkle(false), 1000);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className={`relative group cursor-pointer ${className}`}
          onClick={handleClick}
        >
          {/* Logo with hover animation */}
          <div className="relative overflow-hidden rounded-full transition-transform duration-300 ease-in-out group-hover:scale-110 group-hover:shadow-lg">
            {/* Gradient border on hover */}
            <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-[#FF6200] to-[#1E88E5] p-[2px]">
              <div className="bg-background w-full h-full rounded-full">
                <img src={src} alt={alt} className="h-full w-full object-cover" />
              </div>
            </div>
            
            {/* Base image */}
            <img 
              src={src} 
              alt={alt} 
              className="h-full w-full object-cover group-hover:opacity-0" 
            />
          </div>
          
          {/* Sparkle animation overlay */}
          {sparkle && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 flex items-center justify-center">
                {[...Array(12)].map((_, i) => {
                  const angle = (i / 12) * 360;
                  const delay = (i / 12) * 0.2;
                  return (
                    <div 
                      key={i}
                      className="absolute w-1 h-1 rounded-full bg-accent"
                      style={{
                        transform: `rotate(${angle}deg) translateX(15px)`,
                        animation: `sparkle 1s ${delay}s ease-out forwards`
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent 
        side={isMobile ? "bottom" : "right"}
        className="bg-[#1E88E5] text-white font-open-sans border-none shadow-lg max-w-[200px]"
      >
        <span>Your Smart Guide to Singapore University Admissions!</span>
      </TooltipContent>
    </Tooltip>
  );
};

export default InteractiveLogo;
