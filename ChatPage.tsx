import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Send } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

const ChatPage = () => {
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUsername, setOtherUsername] = useState('');
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id && user) {
      fetchMessages();
      fetchChatInfo();

      // Real-time subscription
      const channel = supabase.channel(`chat-${id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${id}` },
          payload => {
            setMessages(prev => [...prev, payload.new as Message]);
          }
        ).subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [id, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChatInfo = async () => {
    const { data: chat } = await supabase.from('chats').select('*').eq('id', id!).single();
    if (chat) {
      const otherId = chat.buyer_id === user!.id ? chat.seller_id : chat.buyer_id;
      const { data: profile } = await supabase.from('profiles').select('username').eq('user_id', otherId).single();
      setOtherUsername(profile?.username || 'Unknown');
    }
  };

  const fetchMessages = async () => {
    const { data } = await supabase.from('messages').select('*').eq('chat_id', id!).order('created_at', { ascending: true });
    setMessages((data as Message[]) || []);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || sending) return;
    setSending(true);
    await supabase.from('messages').insert({ chat_id: id!, sender_id: user.id, content: newMessage.trim() });
    await supabase.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', id!);
    setNewMessage('');
    setSending(false);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate('/chats')} className="text-foreground"><ArrowLeft size={24} /></button>
        <h1 className="text-lg font-semibold text-foreground">{otherUsername}</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
              msg.sender_id === user?.id 
                ? 'bg-primary text-primary-foreground rounded-br-sm' 
                : 'bg-muted text-foreground rounded-bl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="flex items-center gap-2 px-4 py-3 border-t border-border">
        <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
          placeholder="Type a message..." 
          className="flex-1 px-4 py-2 rounded-full border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
        <button type="submit" disabled={sending || !newMessage.trim()}
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default ChatPage;
