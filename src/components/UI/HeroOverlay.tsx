import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const HeroOverlay = () => {
  const [progress, setProgress] = useState(0);

  // Use a native scroll listener to guarantee update synchronization with the 3D scene
  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      setProgress(currentProgress);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // initial call
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // PAGE 1: ABOVE WATER CAPTION TRANSFORMS (Scroll 0% to 30%)
  let opacityAbove = 1;
  if (progress <= 0.15) {
    opacityAbove = 1;
  } else if (progress >= 0.30) {
    opacityAbove = 0;
  } else {
    opacityAbove = 1 - (progress - 0.15) / (0.30 - 0.15);
  }
  const yAbove = -30 * (1 - opacityAbove);
  const pointerEventsAbove = opacityAbove > 0.05 ? 'auto' : 'none';

  // PAGE 2: UNDERWATER SNAPPER CAPTION TRANSFORMS (Scroll 33% to 66%)
  let opacityBelow = 0;
  if (progress <= 0.33 || progress >= 0.66) {
    opacityBelow = 0;
  } else if (progress >= 0.45 && progress <= 0.55) {
    opacityBelow = 1;
  } else if (progress > 0.33 && progress < 0.45) {
    opacityBelow = (progress - 0.33) / (0.45 - 0.33);
  } else {
    opacityBelow = 1 - (progress - 0.55) / (0.66 - 0.55);
  }
  const yBelow = 30 * (1 - opacityBelow);
  const pointerEventsBelow = opacityBelow > 0.05 ? 'auto' : 'none';

  // PAGE 3: DEEP MARINE WILDERNESS CAPTION TRANSFORMS (Scroll 68% to 100%)
  let opacityDeep = 0;
  if (progress <= 0.68) {
    opacityDeep = 0;
  } else if (progress >= 0.82) {
    opacityDeep = 1;
  } else {
    opacityDeep = (progress - 0.68) / (0.82 - 0.68);
  }
  const yDeep = 30 * (1 - opacityDeep);
  const pointerEventsDeep = opacityDeep > 0.05 ? 'auto' : 'none';

  // Scroll indicator opacity: fades out quickly as soon as scrolling starts
  let opacityIndicator = 1;
  if (progress <= 0) {
    opacityIndicator = 1;
  } else if (progress >= 0.12) {
    opacityIndicator = 0;
  } else {
    opacityIndicator = 1 - progress / 0.12;
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none' }}>
      
      {/* 1. Serene Above-Water Caption Card */}
      <motion.div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10,
          opacity: opacityAbove,
          y: yAbove,
          pointerEvents: pointerEventsAbove,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ textAlign: 'center', pointerEvents: 'auto', padding: '0 20px' }}
        >
          <motion.h1
            style={{
              fontSize: '5rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem',
              textShadow: '0px 10px 30px rgba(0,0,0,0.5)',
              background: 'linear-gradient(to right, #ffffff, #d2b48c)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Fisherman's Love
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            style={{
              fontSize: '1.25rem',
              fontWeight: 300,
              color: 'var(--color-text-muted)',
              maxWidth: '600px',
              margin: '0 auto 2rem auto',
              textShadow: '0px 4px 10px rgba(0,0,0,0.3)'
            }}
          >
            Cast your line into the unknown. A community for those who find serenity in the sea.
          </motion.p>
          
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.5, type: 'spring' }}
            className="btn-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Join the Fishing Community
          </motion.button>
        </motion.div>
      </motion.div>

      {/* 2. Poetic Underwater Caption Card (Hooked Thrills) */}
      <motion.div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10,
          opacity: opacityBelow,
          y: yBelow,
          pointerEvents: pointerEventsBelow,
        }}
      >
        <div style={{ textAlign: 'center', pointerEvents: 'auto', padding: '0 20px' }}>
          <h1
            style={{
              fontSize: '4.5rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '0.8rem',
              textShadow: '0px 10px 35px rgba(0,0,0,0.6)',
              background: 'linear-gradient(to right, #ec7063, #f5b041)', // Snapper Red & Gold gradient
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Tension in the Quiet
          </h1>
          
          <p
            style={{
              fontSize: '1.25rem',
              fontWeight: 300,
              color: '#d5dbdb',
              maxWidth: '620px',
              margin: '0 auto 2.2rem auto',
              textShadow: '0px 4px 12px rgba(0,0,0,0.5)',
              lineHeight: '1.6',
            }}
          >
            A sudden tug, a racing heartbeat. Experience the wild adrenaline of the fight, where silent depths spark into sudden thrill.
          </p>
          
          <motion.button
            className="btn-primary"
            style={{
              background: 'linear-gradient(135deg, #e74c3c 0%, #f39c12 100%)',
              boxShadow: '0 4px 15px rgba(231, 76, 60, 0.4)',
            }}
            whileHover={{ scale: 1.05, boxShadow: '0 6px 20px rgba(231, 76, 60, 0.6)' }}
            whileTap={{ scale: 0.95 }}
          >
            Feel the Rush
          </motion.button>
        </div>
      </motion.div>

      {/* 3. Deep Marine Wilderness Caption Card */}
      <motion.div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10,
          opacity: opacityDeep,
          y: yDeep,
          pointerEvents: pointerEventsDeep,
        }}
      >
        <div style={{ textAlign: 'center', pointerEvents: 'auto', padding: '0 20px' }}>
          <h1
            style={{
              fontSize: '4.5rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.8rem',
              textShadow: '0px 10px 35px rgba(0,0,0,0.7)',
              background: 'linear-gradient(to right, #1abc9c, #3498db)', // Cyan to Blue bioluminescent gradient
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Serene. Calm. Dark.
          </h1>
          
          <p
            style={{
              fontSize: '1.25rem',
              fontWeight: 300,
              color: '#aab7b8',
              maxWidth: '640px',
              margin: '0 auto 2.2rem auto',
              textShadow: '0px 4px 12px rgba(0,0,0,0.6)',
              lineHeight: '1.6',
            }}
          >
            Descend into the quiet wilderness. A sanctuary of glowing kelp, ancient coral gardens, and silent giants drifting through the dark deep.
          </p>
          
          <motion.button
            className="btn-primary"
            style={{
              background: 'linear-gradient(135deg, #1abc9c 0%, #2980b9 100%)',
              boxShadow: '0 4px 18px rgba(26, 188, 156, 0.4)',
              border: 'none',
            }}
            whileHover={{ scale: 1.05, boxShadow: '0 6px 24px rgba(26, 188, 156, 0.6)' }}
            whileTap={{ scale: 0.95 }}
          >
            Explore the Wilderness
          </motion.button>
        </div>
      </motion.div>

      {/* Scroll indicator (fades out on scroll) */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: '2.5rem',
          left: 0,
          right: 0,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          opacity: opacityIndicator,
          width: 'fit-content'
        }}
      >
        <span style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.8 }}>
          Scroll to dive deep
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          style={{ width: '2px', height: '24px', backgroundColor: 'white', opacity: 0.4 }}
        />
      </motion.div>

    </div>
  );
};
