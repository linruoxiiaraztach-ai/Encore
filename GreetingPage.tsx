import { useNavigate } from 'react-router-dom';
import { useDyslexic } from '@/contexts/DyslexicContext';
import CloverFrame from '@/components/CloverFrame';
import { Eye } from 'lucide-react';

const GreetingPage = () => {
  const navigate = useNavigate();
  const { isDyslexic, toggleDyslexic } = useDyslexic();

  return (
    <CloverFrame>
      <div className="flex flex-col items-center justify-center min-h-screen px-8 gap-8">
        <h1 className="text-5xl font-bold text-primary tracking-tight">Encore</h1>
        
        <div className="text-center space-y-1">
          <p className="text-lg font-medium text-foreground">Good for your wallet.</p>
          <p className="text-lg font-medium text-foreground">Great for our planet.</p>
        </div>

        <button onClick={() => navigate('/login')}
          className="px-10 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-base shadow-md hover:opacity-90 transition-opacity">
          Next
        </button>

        <button onClick={toggleDyslexic}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
          <Eye size={16} />
          {isDyslexic ? 'Disable' : 'Enable'} Dyslexic Font
        </button>
      </div>
    </CloverFrame>
  );
};

export default GreetingPage;
