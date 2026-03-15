import React, { useState, useCallback, useEffect } from 'react';
import { IsometricRoom } from './IsometricRoom';
import { PixelAvatar } from './PixelAvatar';
import { ActionButtons } from './ActionButtons';
import { ChatBubble } from './ChatBubble';

import { VibeWallet } from './VibeWallet';
import { use8BitSounds } from './use8BitSounds';
import { AvatarAction, ChatMessage, Furniture, Position } from './types';
import './habbo-styles.css';

// Room furniture configuration
const roomFurniture: Furniture[] = [
  { id: 'chair1', type: 'chair', position: { x: 25, y: 55 }, canSit: true, label: 'Stol' },
  { id: 'chair2', type: 'chair', position: { x: 75, y: 55 }, canSit: true, label: 'Stol' },
  { id: 'sofa1', type: 'sofa', position: { x: 50, y: 75 }, canSit: true, label: 'Soffa' },
  { id: 'table1', type: 'table', position: { x: 50, y: 60 }, canSit: false, label: 'Bord' },
  { id: 'plant1', type: 'plant', position: { x: 15, y: 45 }, canSit: false, label: 'Krukväxt' },
  { id: 'plant2', type: 'plant', position: { x: 85, y: 45 }, canSit: false, label: 'Krukväxt' },
  { id: 'lamp1', type: 'lamp', position: { x: 20, y: 35 }, canSit: false, label: 'Lampa' },
  { id: 'bookshelf1', type: 'bookshelf', position: { x: 88, y: 30 }, canSit: false, label: 'Bokhylla' },
];


export const HabboRoom: React.FC = () => {
  const [currentAction, setCurrentAction] = useState<AvatarAction>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [avatarPosition, setAvatarPosition] = useState<Position>({ x: 50, y: 50 });
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);
  const [sittingOnFurnitureId, setSittingOnFurnitureId] = useState<string | null>(null);
  
  const { playSitSound, playWaveSound, playDanceSound, playChatSound } = use8BitSounds();


  const handleAction = useCallback((action: AvatarAction) => {
    setCurrentAction(action);
    
    // If sitting down, check if we're on sittable furniture
    if (action === 'sit' && !sittingOnFurnitureId) {
      // Find nearby sittable furniture
      const nearbyFurniture = roomFurniture.find(f => 
        f.canSit && 
        Math.abs(f.position.x - avatarPosition.x) < 15 &&
        Math.abs(f.position.y - avatarPosition.y) < 15
      );
      if (nearbyFurniture) {
        setSittingOnFurnitureId(nearbyFurniture.id);
        setAvatarPosition(nearbyFurniture.position);
      }
    } else if (action !== 'sit') {
      setSittingOnFurnitureId(null);
    }
    
    switch (action) {
      case 'sit':
        playSitSound();
        break;
      case 'wave':
        playWaveSound();
        break;
      case 'dance':
        playDanceSound();
        break;
    }
  }, [playSitSound, playWaveSound, playDanceSound, avatarPosition, sittingOnFurnitureId]);

  const handleFurnitureClick = useCallback((furniture: Furniture) => {
    setSelectedFurnitureId(prev => prev === furniture.id ? null : furniture.id);
    
    if (furniture.canSit) {
      // Move avatar to furniture and sit
      setAvatarPosition(furniture.position);
      setCurrentAction('sit');
      setSittingOnFurnitureId(furniture.id);
      playSitSound();
    } else {
      // Just move near the furniture
      setAvatarPosition({
        x: furniture.position.x + (furniture.position.x > 50 ? -10 : 10),
        y: furniture.position.y + 5,
      });
      setCurrentAction('idle');
      setSittingOnFurnitureId(null);
    }
  }, [playSitSound]);

  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputText.trim()) return;
    
    playChatSound();
    
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      text: inputText.trim().slice(0, 50),
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
  }, [inputText, playChatSound]);

  const handleMessageComplete = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
  }, []);

  // Mock vibe data - would connect to GoodVibe system
  const vibesRemaining = 3;
  const totalVibes = 5;

  return (
    <div className="habbo-room-wrapper">
      {/* Echo2000 Logo */}
      <div className="habbo-logo">
        <span className="habbo-logo-text">Echo2000</span>
      </div>

      {/* Vibe Wallet */}
      <VibeWallet vibesRemaining={vibesRemaining} totalVibes={totalVibes} />

      {/* Main Room Area */}
      <div className="habbo-room">
        <IsometricRoom
          furniture={roomFurniture}
          avatarPosition={avatarPosition}
          selectedFurnitureId={selectedFurnitureId}
          onFurnitureClick={handleFurnitureClick}
        >
          <PixelAvatar action={currentAction} />
          
          {/* Chat bubbles floating above avatar */}
          <div className="chat-bubbles-container">
            {messages.map(message => (
              <ChatBubble 
                key={message.id} 
                message={message}
                onComplete={() => handleMessageComplete(message.id)}
              />
            ))}
          </div>
        </IsometricRoom>

      </div>

      <div className="habbo-controls">
          <ActionButtons 
            currentAction={currentAction} 
            onAction={handleAction} 
          />
          
          {/* Chat input */}
          <form onSubmit={handleSendMessage} className="habbo-chat-form">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Skriv något..."
              className="habbo-chat-input"
              maxLength={50}
            />
            <button type="submit" className="pixel-button pixel-button-send">
              Säg
            </button>
          </form>
          
          {/* Furniture hint */}
          <p className="furniture-hint">
            Klicka på möbler för att interagera
          </p>
      </div>
    </div>
  );
};
