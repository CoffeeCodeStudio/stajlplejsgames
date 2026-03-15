import React, { useEffect, useState } from 'react';
import { ChatMessage } from './types';

interface ChatBubbleProps {
  message: ChatMessage;
  onComplete: () => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onComplete }) => {
  const [offset, setOffset] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 4000; // 4 seconds float up time

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Float up
      setOffset(progress * 80);
      
      // Fade out in last 25%
      if (progress > 0.75) {
        setOpacity(1 - ((progress - 0.75) / 0.25));
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    requestAnimationFrame(animate);
  }, [onComplete]);

  return (
    <div 
      className="pixel-chat-bubble"
      style={{ 
        transform: `translateY(-${offset}px)`,
        opacity,
      }}
    >
      <div className="pixel-bubble-content">
        {message.text}
      </div>
      <div className="pixel-bubble-tail" />
    </div>
  );
};
