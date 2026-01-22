import React from 'react';

/**
 * Lightweight background component for mobile devices.
 * Uses CSS animations instead of heavy WebGL/Three.js rendering.
 * Matches the visual theme of the desktop 3D DNA animation.
 */
export const MobileBackground: React.FC = () => {
    return (
        <div className="absolute inset-0 z-0 w-full h-full overflow-hidden">
            {/* Base gradient background */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(135deg, #0f0c29 0%, #1a1a4e 25%, #24243e 50%, #0f1624 75%, #0f0c29 100%)',
                    backgroundSize: '400% 400%',
                    animation: 'gradientShift 15s ease infinite',
                }}
            />

            {/* Animated orbs for depth - mimics DNA colors */}
            <div className="absolute inset-0">
                {/* Blue orb */}
                <div
                    className="absolute rounded-full blur-3xl opacity-30"
                    style={{
                        width: '40vw',
                        height: '40vw',
                        maxWidth: '300px',
                        maxHeight: '300px',
                        background: 'radial-gradient(circle, #1a237e 0%, transparent 70%)',
                        top: '20%',
                        left: '10%',
                        animation: 'floatOrb1 8s ease-in-out infinite',
                    }}
                />

                {/* Cyan orb */}
                <div
                    className="absolute rounded-full blur-3xl opacity-25"
                    style={{
                        width: '35vw',
                        height: '35vw',
                        maxWidth: '250px',
                        maxHeight: '250px',
                        background: 'radial-gradient(circle, #00bcd4 0%, transparent 70%)',
                        top: '50%',
                        right: '5%',
                        animation: 'floatOrb2 10s ease-in-out infinite',
                    }}
                />

                {/* Green orb */}
                <div
                    className="absolute rounded-full blur-3xl opacity-20"
                    style={{
                        width: '30vw',
                        height: '30vw',
                        maxWidth: '200px',
                        maxHeight: '200px',
                        background: 'radial-gradient(circle, #4caf50 0%, transparent 70%)',
                        bottom: '15%',
                        left: '30%',
                        animation: 'floatOrb3 12s ease-in-out infinite',
                    }}
                />

                {/* Purple orb */}
                <div
                    className="absolute rounded-full blur-3xl opacity-25"
                    style={{
                        width: '45vw',
                        height: '45vw',
                        maxWidth: '350px',
                        maxHeight: '350px',
                        background: 'radial-gradient(circle, #9c27b0 0%, transparent 70%)',
                        top: '10%',
                        right: '20%',
                        animation: 'floatOrb4 9s ease-in-out infinite',
                    }}
                />
            </div>

            {/* Subtle particle effect using pseudo-elements */}
            <div className="absolute inset-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full bg-white"
                        style={{
                            width: `${2 + Math.random() * 3}px`,
                            height: `${2 + Math.random() * 3}px`,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            opacity: 0.2 + Math.random() * 0.3,
                            animation: `twinkle ${3 + Math.random() * 4}s ease-in-out infinite`,
                            animationDelay: `${Math.random() * 5}s`,
                        }}
                    />
                ))}
            </div>

            {/* CSS keyframe animations */}
            <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes floatOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -30px) scale(1.1); }
          66% { transform: translate(-10px, 20px) scale(0.95); }
        }
        
        @keyframes floatOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-25px, 15px) scale(1.05); }
          50% { transform: translate(15px, -20px) scale(0.98); }
          75% { transform: translate(-10px, -10px) scale(1.02); }
        }
        
        @keyframes floatOrb3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(30px, -15px) scale(1.08); }
          70% { transform: translate(-20px, 25px) scale(0.92); }
        }
        
        @keyframes floatOrb4 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-15px, 20px) scale(1.12); }
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
      `}</style>
        </div>
    );
};

export default MobileBackground;
