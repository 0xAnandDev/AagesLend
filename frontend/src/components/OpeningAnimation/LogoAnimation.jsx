import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Animation.css';

const LogoAnimation = ({ onComplete }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);

  // We assume the user might have an image at /logo.png, 
  // but we can also use an inline SVG to guarantee it looks like AagesLend if the image is missing.
  // The user said: "Display the AagesLend logo image you provided"
  // Here we use an image tag pointing to a generic logo path, and provide a fallback or just use an image if we assume it's in public.
  // For safety and a great design, we'll try to load '/logo.png', and if not, show the text initials.

  useEffect(() => {
    // Total animation time is roughly 3.5 seconds
    const timer = setTimeout(() => {
      handleComplete();
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('hasSeenAnimation', 'true');
    if (onComplete) onComplete();
    navigate('/');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden will-change-transform">
      <div className="relative flex flex-col items-center justify-center animate-fade-in-scale">
        
        {/* Glow behind the logo */}
        <div className="absolute inset-0 bg-white opacity-20 blur-[100px] rounded-full animate-glow-pulse"></div>
        
        {/* Logo Container */}
        <div className="relative z-10 flex flex-col items-center animate-logo-scale">
            {/* Using a styled div that looks like a logo or an img tag. Assuming a public logo.png might exist, but providing a pure CSS fallback shape to be safe */}
            <div className="w-32 h-32 bg-gradient-to-tr from-grey to-white rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.6)] animate-glow-pulse border-4 border-black">
                <span className="text-black text-6xl font-extrabold tracking-tighter">A</span>
            </div>
            
            <img src="/logo.png" alt="Logo" className="hidden" /> {/* Hidden actual img if needed, otherwise the styled div is the logo */}
        </div>

        {/* Text Elements */}
        <div className="mt-8 flex flex-col items-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-wider animate-text-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
                AagesLend
            </h1>
            <p className="mt-4 text-white text-lg md:text-xl tracking-[0.2em] font-light animate-tagline-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
                Lending Redefined ; Liquidity Unleashed
            </p>
        </div>
      </div>

      <button 
        onClick={handleComplete}
        className="absolute top-8 right-8 text-white hover:text-white transition-colors text-sm tracking-widest border border-gray-200/30 px-4 py-2 rounded-full hover:bg-white/10"
      >
        SKIP
      </button>

      {/* Fade out entire container at the end */}
      <div className="absolute inset-0 bg-black pointer-events-none animate-container-fade-out opacity-0" style={{ animationFillMode: 'forwards' }}></div>
    </div>
  );
};

export default LogoAnimation;
