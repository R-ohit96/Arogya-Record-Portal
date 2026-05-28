import React, { useEffect, useState } from 'react';

const SplashScreen = ({ onComplete }) => {
  const [showText, setShowText] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Show text after logo animation (1.5s delay)
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 1500);

    // Zoom takes 1.5s (finishes at 3.0s). Wait 2s = 5.0s.
    // Start fading out the whole splash screen at 5.0 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 5000);

    // Complete and unmount
    const unmountTimer = setTimeout(() => {
      onComplete();
    }, 5500);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, [onComplete]);

  return (
    <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="splash-content">
        
        {/* Animated Logo Container */}
        <div className="splash-logo-container">
          <img 
            src="/logo.png" 
            alt="Aarogya Logo" 
            className="splash-logo-img"
          />
          {/* Shine Overlay */}
          <div className="splash-shine"></div>
        </div>

        {/* Portal Name (appears later) */}
        <h1 className={`splash-title ${showText ? 'show' : ''}`}>
          Arogya Record Portal
        </h1>

      </div>
    </div>
  );
};

export default SplashScreen;
