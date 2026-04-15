import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Bookmark, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ItemDetail {
  id: string;
  name: string;
  price: number;
  description: string | null;
  category: string;
  colour: string | null;
  material: string | null;
  size: string | null;
  additional_info: string | null;
  photos: string[];
  seller_id: string;
}

const ItemDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [sellerName, setSellerName] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) fetchItem();
  }, [id]);

  const fetchItem = async () => {
    const { data } = await supabase.from('items').select('*').eq('id', id!).single();
    if (data) {
      setItem(data as ItemDetail);
      const { data: profile } = await supabase.from('profiles').select('username').eq('user_id', data.seller_id).single();
      if (profile) setSellerName(profile.username);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user || !item) return;
    const { error } = await supabase.from('saved_items').insert({ user_id: user.id, item_id: item.id });
    if (error?.code === '23505') toast.info('Already saved!');
    else if (error) toast.error('Failed to save');
    else toast.success('Saved to My Cart!');
  };

  const handleContact = async () => {
    if (!user || !item) return;
    // Find or create chat
    const { data: existing } = await supabase.from('chats')
      .select('id').eq('item_id', item.id).eq('buyer_id', user.id).eq('seller_id', item.seller_id).single();
    if (existing) {
      navigate(`/chat/${existing.id}`);
    } else {
      const { data: newChat, error } = await supabase.from('chats')
        .insert({ item_id: item.id, buyer_id: user.id, seller_id: item.seller_id })
        .select('id').single();
      if (newChat) navigate(`/chat/${newChat.id}`);
      else toast.error('Failed to start chat');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!item) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Item not found</div>;

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)} className="text-foreground"><ArrowLeft size={24} /></button>
        <h1 className="text-lg font-semibold text-foreground">Item Details</h1>
      </div>

      {/* Photos */}
      <div className="aspect-square bg-muted flex items-center justify-center">
        {item.photos && item.photos.length > 0 ? (
          <img src={item.photos[0]} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-6xl">📦</span>
        )}
      </div>

      <div className="px-4 py-4 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-foreground">{item.name}</h2>
            <p className="text-2xl font-bold text-primary mt-1">{item.price} manat</p>
          </div>
          <span className="px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground">{item.category}</span>
        </div>

        <p className="text-sm text-muted-foreground">Sold by <span className="font-medium text-foreground">{sellerName}</span></p>

        {item.description && <div><p className="text-xs text-muted-foreground font-medium">Description</p><p className="text-sm text-foreground">{item.description}</p></div>}
        
        <div className="grid grid-cols-2 gap-3">
          {item.size && <div><p className="text-xs text-muted-foreground font-medium">Size</p><p className="text-sm text-foreground">{item.size}</p></div>}
          {item.colour && <div><p className="text-xs text-muted-foreground font-medium">Colour</p><p className="text-sm text-foreground">{item.colour}</p></div>}
          {item.material && <div><p className="text-xs text-muted-foreground font-medium">Material</p><p className="text-sm text-foreground">{item.material}</p></div>}
        </div>

        {item.additional_info && <div><p className="text-xs text-muted-foreground font-medium">Additional Information</p><p className="text-sm text-foreground">{item.additional_info}</p></div>}

        <div className="flex gap-3 pt-4">
          <button onClick={handleSave} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-muted text-foreground font-semibold hover:bg-accent transition-colors">
            <Bookmark size={18} /> Save
          </button>
          <button onClick={handleContact} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
            <MessageCircle size={18} /> Contact
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailPage;
