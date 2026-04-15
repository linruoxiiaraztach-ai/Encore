import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, ImagePlus, Upload } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['Clothes', 'Books', 'Electronics', 'Kitchen Items', 'Handmade', 'Furniture', 'Others'];

const AddItemPage = () => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [colour, setColour] = useState('');
  const [material, setMaterial] = useState('');
  const [size, setSize] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [category, setCategory] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotos(prev => [...prev, ...files]);
    const urls = files.map(f => URL.createObjectURL(f));
    setPhotoPreviewUrls(prev => [...prev, ...urls]);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim() || !price.trim() || !category) {
      toast.error('Please fill in name, price, and category');
      return;
    }

    setUploading(true);
    setUploadStatus('Adding your item ⏳');

    try {
      // Upload photos
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const filePath = `${user.id}/${Date.now()}_${photo.name}`;
        const { error } = await supabase.storage.from('item-photos').upload(filePath, photo);
        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('item-photos').getPublicUrl(filePath);
          photoUrls.push(publicUrl);
        }
      }

      await supabase.from('items').insert({
        seller_id: user.id,
        name: name.trim(),
        price: parseFloat(price),
        description: description.trim() || null,
        category,
        colour: colour.trim() || null,
        material: material.trim() || null,
        size: size.trim() || null,
        additional_info: additionalInfo.trim() || null,
        photos: photoUrls,
      });

      setUploadStatus('Item added ✅');
      setTimeout(() => navigate('/home'), 1500);
    } catch {
      toast.error('Failed to add item');
      setUploading(false);
      setUploadStatus(null);
    }
  };

  if (uploadStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <p className="text-xl font-semibold text-foreground">{uploadStatus}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)} className="text-foreground"><ArrowLeft size={24} /></button>
        <h1 className="text-lg font-semibold text-foreground">Add Item</h1>
      </div>

      <form onSubmit={handleUpload} className="px-4 space-y-4">
        {/* Photo upload */}
        <div>
          <label className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground cursor-pointer hover:border-primary transition-colors">
            <ImagePlus size={20} /> Add Photos
            <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
          </label>
          {photoPreviewUrls.length > 0 && (
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {photoPreviewUrls.map((url, i) => (
                <img key={i} src={url} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
              ))}
            </div>
          )}
        </div>

        <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        <input type="number" step="0.01" placeholder="Price" value={price} onChange={e => setPrice(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} rows={3}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
        <input type="text" placeholder="Colour" value={colour} onChange={e => setColour(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        <input type="text" placeholder="Material" value={material} onChange={e => setMaterial(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        <input type="text" placeholder="Size" value={size} onChange={e => setSize(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        <textarea placeholder="Additional Information" value={additionalInfo} onChange={e => setAdditionalInfo(e.target.value)} rows={2}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" />

        {/* Category */}
        <div>
          <p className="text-sm text-muted-foreground mb-2 font-medium">Category</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat} type="button" onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  category === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={uploading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
          <Upload size={18} /> Upload
        </button>
      </form>
    </div>
  );
};

export default AddItemPage;
