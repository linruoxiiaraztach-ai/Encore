const CloverLeaf = () => (
  <svg viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path d="M35 10 C25 0, 5 5, 10 20 C0 15, -5 35, 10 35 C0 40, 5 55, 20 50 C15 60, 25 70, 35 60 C45 70, 55 60, 50 50 C65 55, 70 40, 60 35 C70 25, 65 15, 50 20 C55 5, 45 0, 35 10Z" 
      fill="hsl(288 40% 84%)" opacity="0.6"/>
    <path d="M35 18 C30 12, 18 14, 20 24 C14 20, 10 30, 18 34 C10 36, 14 46, 24 42 C20 48, 28 54, 35 48 C42 54, 50 48, 46 42 C56 46, 60 36, 52 34 C60 30, 56 20, 50 24 C52 14, 40 12, 35 18Z" 
      fill="hsl(288 40% 84%)" opacity="0.4"/>
    <circle cx="35" cy="34" r="4" fill="hsl(270 20% 56%)" opacity="0.5"/>
  </svg>
);

const CloverFrame = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative min-h-screen ${className}`}>
    <div className="clover-corner clover-corner--tl"><CloverLeaf /></div>
    <div className="clover-corner clover-corner--tr"><CloverLeaf /></div>
    <div className="clover-corner clover-corner--bl"><CloverLeaf /></div>
    <div className="clover-corner clover-corner--br"><CloverLeaf /></div>
    {children}
  </div>
);

export default CloverFrame;
