import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import BottomNav from '@/components/BottomNav';

const CATEGORIES = ['All', 'Clothes', 'Books', 'Electronics', 'Kitchen Items', 'Handmade', 'Furniture', 'Others'];

interface Item {
  id: string;
  name: string;
  price: number;
  photos: string[];
  category: string;
  seller_id: string;
}

const HomePage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchItems();
  }, [selectedCategory]);

  const fetchItems = async () => {
    setLoading(true);
    let query = supabase.from('items').select('*').order('created_at', { ascending: false });
    if (selectedCategory !== 'All') {
      query = query.eq('category', selectedCategory);
    }
    const { data } = await query;
    setItems((data as Item[]) || []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold text-primary">Encore</h1>
      </div>

      {/* Categories */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="px-4 py-2">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">No items yet</p>
            <p className="text-sm mt-1">Be the first to list something!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
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
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default HomePage;
