import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProfilePage } from '@/components/ProfilePage';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchUserByUsername = async () => {
      if (!username) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id')
          .ilike('username', username)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          setNotFound(true);
        } else if (!data) {
          setNotFound(true);
        } else {
          setUserId(data.user_id);
        }
      } catch (err) {
        console.error('Error:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUserByUsername();
  }, [username]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Laddar profil...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="font-display font-bold text-2xl mb-4">
            Profil hittades inte
          </h1>
          <p className="text-muted-foreground mb-4">
            Användaren "{username}" finns inte.
          </p>
          <Button variant="link" onClick={() => navigate('/')} className="text-primary">
            ← Tillbaka till startsidan
          </Button>
        </div>
      </div>
    );
  }

  return <ProfilePage userId={userId || undefined} />;
}
