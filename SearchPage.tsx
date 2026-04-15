import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import { Search } from 'lucide-react';

interface Item {
  id: string;
  name: string;
  price: number;
  photos: string[];
  category: string;
}

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Item[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const { data } = await supabase.from('items').select('*').ilike('name', `%${query.trim()}%`).order('created_at', { ascending: false });
    setResults((data as Item[]) || []);
    setSearched(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-4 pb-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search items..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <button type="submit" className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
            Search
          </button>
        </form>
      </div>

      <div className="px-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : searched && results.length === 0 ? (
          <p className="text-center py-20 text-muted-foreground">No items found</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {results.map(item => (
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

export default SearchPage;
