import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import BottomNav from '@/components/BottomNav';

interface ChatPreview {
  id: string;
  other_username: string;
  other_avatar: string | null;
  item_name: string | null;
  last_message: string | null;
  updated_at: string;
}

const ChatsPage = () => {
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) fetchChats();
  }, [user]);

  const fetchChats = async () => {
    const { data: chatData } = await supabase.from('chats').select('*').order('updated_at', { ascending: false });
    if (!chatData) { setLoading(false); return; }

    const previews: ChatPreview[] = [];
    for (const chat of chatData) {
      const otherId = chat.buyer_id === user!.id ? chat.seller_id : chat.buyer_id;
      const { data: profile } = await supabase.from('profiles').select('username, avatar_url').eq('user_id', otherId).single();
      
      let itemName = null;
      if (chat.item_id) {
        const { data: item } = await supabase.from('items').select('name').eq('id', chat.item_id).single();
        itemName = item?.name || null;
      }

      const { data: lastMsg } = await supabase.from('messages').select('content').eq('chat_id', chat.id).order('created_at', { ascending: false }).limit(1).single();

      previews.push({
        id: chat.id,
        other_username: profile?.username || 'Unknown',
        other_avatar: profile?.avatar_url || null,
        item_name: itemName,
        last_message: lastMsg?.content || null,
        updated_at: chat.updated_at,
      });
    }
    setChats(previews);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold text-primary">Chats</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : chats.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">No chats yet</p>
          <p className="text-sm mt-1">Contact a seller to start chatting!</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {chats.map(chat => (
            <button key={chat.id} onClick={() => navigate(`/chat/${chat.id}`)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                {chat.other_avatar ? (
                  <img src={chat.other_avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-primary">{chat.other_username[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">{chat.other_username}</p>
                {chat.item_name && <p className="text-xs text-muted-foreground">Re: {chat.item_name}</p>}
                {chat.last_message && <p className="text-xs text-muted-foreground truncate mt-0.5">{chat.last_message}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default ChatsPage;
