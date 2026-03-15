import { Heart, MessageCircle, Ban, FileText, UserPlus, Clock, UserCheck, UserMinus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFriendship } from "@/hooks/useFriendship";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface FriendActionButtonsProps {
  targetUserId: string;
  targetUsername: string;
}

export function FriendActionButtons({ targetUserId, targetUsername }: FriendActionButtonsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { status, loading, sendRequest, acceptRequest, removeFriendship } = useFriendship(targetUserId);

  const handleSendMessage = () => {
    // Navigate to mailbox with recipient pre-filled (future feature)
    navigate('/', { state: { tab: 'mejl', recipient: targetUsername } });
  };

  const renderFriendButton = () => {
    if (!user) {
      return (
        <Button 
          variant="link" 
          size="sm" 
          className="text-primary h-auto py-1 px-2 uppercase font-bold"
          onClick={() => navigate('/auth')}
        >
          <UserPlus className="w-3 h-3 mr-1" />
          Logga in för att lägga till
        </Button>
      );
    }

    if (loading) {
      return (
        <Button 
          variant="link" 
          size="sm" 
          className="text-muted-foreground h-auto py-1 px-2 uppercase font-bold"
          disabled
        >
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Laddar...
        </Button>
      );
    }

    switch (status) {
      case 'loading':
        return (
          <Button 
            variant="link" 
            size="sm" 
            className="text-muted-foreground h-auto py-1 px-2 uppercase font-bold"
            disabled
          >
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Laddar...
          </Button>
        );
      
      case 'accepted':
        return (
          <Button 
            variant="link" 
            size="sm" 
            className="text-green-500 h-auto py-1 px-2 uppercase font-bold group"
            onClick={removeFriendship}
          >
            <UserCheck className="w-3 h-3 mr-1" />
            <span className="group-hover:hidden">Vänner ✓</span>
            <span className="hidden group-hover:inline text-destructive">Ta bort vän</span>
          </Button>
        );
      
      case 'pending_sent':
        return (
          <Button 
            variant="link" 
            size="sm" 
            className="text-yellow-500 h-auto py-1 px-2 uppercase font-bold group"
            onClick={removeFriendship}
          >
            <Clock className="w-3 h-3 mr-1" />
            <span className="group-hover:hidden">Väntar...</span>
            <span className="hidden group-hover:inline text-destructive">Avbryt</span>
          </Button>
        );
      
      case 'pending_received':
        return (
          <div className="flex items-center gap-1">
            <Button 
              variant="link" 
              size="sm" 
              className="text-green-500 h-auto py-1 px-2 uppercase font-bold"
              onClick={acceptRequest}
            >
              <UserCheck className="w-3 h-3 mr-1" />
              Acceptera
            </Button>
            <Button 
              variant="link" 
              size="sm" 
              className="text-destructive h-auto py-1 px-2 uppercase font-bold"
              onClick={removeFriendship}
            >
              <UserMinus className="w-3 h-3 mr-1" />
              Avböj
            </Button>
          </div>
        );
      
      case 'none':
      default:
        return (
          <Button 
            variant="link" 
            size="sm" 
            className="text-primary h-auto py-1 px-2 uppercase font-bold"
            onClick={sendRequest}
          >
            <Heart className="w-3 h-3 mr-1" />
            Skapa Relation
          </Button>
        );
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
      {renderFriendButton()}
      
      <span className="text-muted-foreground">|</span>
      
      <Button 
        variant="link" 
        size="sm" 
        className="text-primary h-auto py-1 px-2 uppercase font-bold"
        onClick={handleSendMessage}
      >
        <MessageCircle className="w-3 h-3 mr-1" />
        Skicka Mess
      </Button>
      
      <span className="text-muted-foreground">|</span>
      
      <Button variant="link" size="sm" className="text-primary h-auto py-1 px-2 uppercase font-bold">
        <Ban className="w-3 h-3 mr-1" />
        Blockera
      </Button>
      
      <span className="text-muted-foreground">|</span>
      
      <Button variant="link" size="sm" className="text-primary h-auto py-1 px-2 uppercase font-bold">
        <FileText className="w-3 h-3 mr-1" />
        Anteckningar
      </Button>
    </div>
  );
}
