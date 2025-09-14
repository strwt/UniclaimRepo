import { useState, useEffect } from 'react';

interface AnnouncementBannerProps {
  message: string;
  isVisible: boolean;
  priority?: 'normal' | 'urgent';
}

export default function AnnouncementBanner({ 
  message, 
  isVisible, 
  priority = 'normal' 
}: AnnouncementBannerProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible && message) {
      // Small delay to ensure smooth animation start
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [isVisible, message]);

  if (!isVisible || !message) {
    return null;
  }

  return (
    <div className="relative flex-1 mx-4 overflow-hidden">
      {/* Scrolling text container */}
      <div className="relative py-2">
        <div 
          className={`whitespace-nowrap text-white font-medium text-sm tracking-wide ${
            isAnimating ? 'animate-scroll' : 'opacity-0'
          }`}
          style={{
            animationDuration: '20s',
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite'
          }}
        >
          {/* Repeat message for seamless scrolling */}
          <span className="inline-block mr-16">
            {message}
          </span>
          <span className="inline-block mr-16">
            {message}
          </span>
          <span className="inline-block mr-16">
            {message}
          </span>
        </div>
      </div>

      {/* Priority indicator for urgent announcements */}
      {priority === 'urgent' && (
        <div className="absolute top-1 right-2 flex items-center space-x-1">
          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping"></div>
          <span className="text-yellow-200 text-xs font-semibold">URGENT</span>
        </div>
      )}
    </div>
  );
}
