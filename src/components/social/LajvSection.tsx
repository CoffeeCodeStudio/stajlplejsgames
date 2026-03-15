import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLajv } from '@/contexts/LajvContext';
import { Avatar } from '../Avatar';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Send, Radio, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuthDialog } from '../auth/AuthDialog';
import { toast } from 'sonner';

export function LajvSection() {
  const { user, loading: authLoading } = useAuth();
  const { messages, sendMessage, sending } = useLajv();
  const [newMessage, setNewMessage] = useState('');
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage('');
    } else {
      toast.error('Kunde inte skicka meddelandet');
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const timeStr = date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
    return isToday ? `Idag kl: ${timeStr}` : date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' }) + ` kl: ${timeStr}`;
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    return diffMins;
  };

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laddar...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Message input area - at top */}
      <div className="p-4 border-b border-border bg-card/50">
        <div className="flex gap-3">
          <Avatar
            name={user?.user_metadata?.username || user?.email?.split('@')[0] || 'Gäst'}
            status="online"
            size="sm"
          />
          <div className="flex-1 flex flex-col gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Dela något med alla just nu..."
              className="min-h-[60px] max-h-[120px] resize-none bg-input border-border focus:ring-primary input-glow"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {newMessage.length}/280 {!user && '(skriver som Gäst)'}
              </span>
              <Button
                onClick={handleSendMessage}
                disabled={sending || !newMessage.trim() || newMessage.length > 280}
                className="btn-nostalgic gap-2"
              >
                <Send className="w-4 h-4" />
                Skicka
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto scrollbar-nostalgic p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Radio className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-center">Inga lajv-meddelanden just nu.</p>
            <p className="text-sm text-center mt-1">Var först med att dela något!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3 p-3 rounded-xl bg-card/70 backdrop-blur-sm",
                "border border-border/50 shadow-sm hover:shadow-md transition-shadow",
                msg.user_id === user?.id && "bg-primary/5 border-primary/20"
              )}
            >
              <Avatar
                name={msg.username}
                src={msg.avatar_url || undefined}
                size="sm"
                status="online"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm truncate">{msg.username}</span>
                  <span className="text-xs text-muted-foreground">{formatTime(msg.created_at)}</span>
                </div>
                <p className="text-sm break-words text-foreground drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">{msg.message}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{getTimeRemaining(msg.expires_at)} min kvar</span>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </div>
  );
}
