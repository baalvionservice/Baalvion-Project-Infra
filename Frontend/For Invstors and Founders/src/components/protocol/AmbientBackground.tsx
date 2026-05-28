/**
 * Ambient background component for premium visual effect
 * Creates subtle animated gradients
 */
const AmbientBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Primary ambient glow */}
      <div 
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-float"
        style={{ background: 'radial-gradient(circle, hsl(45 93% 58% / 0.05) 0%, transparent 70%)' }}
      />
      {/* Secondary ambient glow */}
      <div 
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl animate-float"
        style={{ 
          background: 'radial-gradient(circle, hsl(45 93% 58% / 0.03) 0%, transparent 70%)',
          animationDelay: '1.5s' 
        }}
      />
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(45 93% 58% / 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(45 93% 58% / 0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />
    </div>
  );
};

export default AmbientBackground;
