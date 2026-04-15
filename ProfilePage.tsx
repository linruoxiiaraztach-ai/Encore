import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDyslexic } from '@/contexts/DyslexicContext';
import BottomNav from '@/components/BottomNav';
import { Camera, Eye, LogOut, Package, ShoppingBag, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Item {
  id: string;
  name: string;
  price: number;
  photos: string[];
  category: string;
}

const ProfilePage = () => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { isDyslexic, toggleDyslexic } = useDyslexic();
  const [view, setView] = useState<'none' | 'forSale' | 'cart'>('none');
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [savedItems, setSavedItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
    if (uploadError) { toast.error('Upload failed'); return; }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', user.id);
    await refreshProfile();
    toast.success('Profile picture updated!');
  };

  const fetchMyItems = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('items').select('*').eq('seller_id', user.id).order('created_at', { ascending: false });
    setMyItems((data as Item[]) || []);
    setLoading(false);
  };

  const fetchSavedItems = async () => {
    if (!user) return;
    setLoading(true);
    const { data: saved } = await supabase.from('saved_items').select('item_id').eq('user_id', user.id);
    if (saved && saved.length > 0) {
      const ids = saved.map(s => s.item_id);
      const { data: items } = await supabase.from('items').select('*').in('id', ids);
      setSavedItems((items as Item[]) || []);
    } else {
      setSavedItems([]);
    }
    setLoading(false);
  };

  const showForSale = () => { setView('forSale'); fetchMyItems(); };
  const showCart = () => { setView('cart'); fetchSavedItems(); };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const renderItems = (items: Item[]) => (
    <div className="grid grid-cols-2 gap-3 mt-3">
      {items.map(item => (
        <button key={item.id} onClick={() => navigate(`/item/${item.id}`)}
          className="bg-card rounded-xl overflow-hidden shadow-sm border border-border text-left hover:shadow-md transition-shadow">
          <div className="aspect-square bg-muted flex items-center justify-center">
            {item.photos && item.photos.length > 0 ? (
              <img src={item.photos[0]} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">📦</span>
            )}
          </div>
          <div className="p-2">
            <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
            <p className="text-primary font-bold text-sm">{item.price} manat</p>
          </div>
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-4 pb-6">
        <h1 className="text-2xl font-bold text-primary mb-6">Profile</h1>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 border-primary">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-primary">{profile?.username?.[0]?.toUpperCase()}</span>
            )}
          </div>
          <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-sm text-foreground cursor-pointer hover:bg-accent transition-colors">
            <Camera size={16} /> Add Photo
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </label>
        </div>

        {/* Info */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between px-1"><span className="text-sm text-muted-foreground">Username</span><span className="text-sm font-medium text-foreground">{profile?.username}</span></div>
          <div className="flex justify-between px-1"><span className="text-sm text-muted-foreground">Email</span><span className="text-sm font-medium text-foreground">{profile?.email}</span></div>
          <div className="flex justify-between px-1"><span className="text-sm text-muted-foreground">Location</span><span className="text-sm font-medium text-foreground">{profile?.location}</span></div>
        </div>

        {/* Actions */}
        <div className="space-y-2 mb-4">
          <button onClick={toggleDyslexic}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-muted text-foreground hover:bg-accent transition-colors">
            <Eye size={18} /> <span className="text-sm font-medium">{isDyslexic ? 'Disable' : 'Enable'} Dyslexic Font</span>
          </button>
          <button onClick={showForSale}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'forSale' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-accent'}`}>
            <Package size={18} /> <span className="text-sm font-medium">For Sale</span>
          </button>
          <button onClick={showCart}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'cart' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-accent'}`}>
            <ShoppingBag size={18} /> <span className="text-sm font-medium">My Cart</span>
          </button>
          <button onClick={() => navigate('/add-item')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
            <Plus size={18} /> <span className="text-sm font-medium">Add Item</span>
          </button>
          <button onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity">
            <LogOut size={18} /> <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>

        {/* Item lists */}
        {view !== 'none' && (
          <div>
            <h2 className="text-lg font-semibold text-foreground">{view === 'forSale' ? 'My Items For Sale' : 'My Cart'}</h2>
            {loading ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : (view === 'forSale' ? myItems : savedItems).length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">No items</p>
            ) : (
              renderItems(view === 'forSale' ? myItems : savedItems)
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default ProfilePage;
