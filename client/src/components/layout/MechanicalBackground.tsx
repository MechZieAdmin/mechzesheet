import React from 'react';
import { Cog, Settings } from 'lucide-react';

export default function MechanicalBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-gpt-panel pointer-events-none">
      {/* Dark overlay for blending */}
      <div className="absolute inset-0 bg-gpt-panel/60 z-10"></div>
      
      {/* Subtle radial gradient */}
      <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-gpt-panel/80 to-gpt-panel" />

      <div className="absolute inset-0 flex items-center justify-center opacity-10" style={{ perspective: '1000px' }}>
        
        {/* Giant background gear */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-slow-3d">
          <Cog size={800} strokeWidth={0.5} className="text-gpt-muted" />
        </div>

        {/* Medium gear top left */}
        <div className="absolute -top-20 -left-20 animate-spin-reverse-3d" style={{ animationDelay: '-5s' }}>
          <Settings size={400} strokeWidth={1} className="text-gpt-muted opacity-50" />
        </div>

        {/* Medium gear bottom right */}
        <div className="absolute -bottom-40 -right-20 animate-spin-reverse-3d" style={{ animationDelay: '-10s' }}>
          <Cog size={500} strokeWidth={1} className="text-gpt-muted opacity-40" />
        </div>

        {/* Small floating gears */}
        <div className="absolute top-1/4 right-1/4 animate-spin-slow-3d" style={{ animationDelay: '-2s' }}>
          <Settings size={150} strokeWidth={1.5} className="text-gpt-light opacity-30" />
        </div>
        
        <div className="absolute bottom-1/4 left-1/3 animate-spin-reverse-3d" style={{ animationDelay: '-8s' }}>
          <Cog size={200} strokeWidth={1} className="text-gpt-light opacity-20" />
        </div>

      </div>
    </div>
  );
}
