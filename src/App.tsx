import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Environment, Sky, ContactShadows, OrbitControls } from '@react-three/drei';
import { Suspense, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Ocean } from './components/Canvas/Ocean';
import { Boat } from './components/Canvas/Boat';
import { Underwater } from './components/Canvas/Underwater';
import { Marine } from './components/Canvas/Marine';
import { HeroOverlay } from './components/UI/HeroOverlay';
import './index.css';

interface CameraControllerProps {
  scrollProgress: React.RefObject<number>;
  fishPositionRef: React.RefObject<THREE.Vector3>;
  orbitRef: React.RefObject<any>;
}

// Camera controller that maps scroll percentage to 3D path zoom/dive
const CameraController = ({ scrollProgress, fishPositionRef, orbitRef }: CameraControllerProps) => {
  const { camera, scene } = useThree();
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    const p = scrollProgress.current ?? 0;

    // Toggle OrbitControls on/off and auto-rotation dynamically
    if (orbitRef && orbitRef.current) {
      orbitRef.current.enabled = p <= 0.02;
      orbitRef.current.autoRotate = p <= 0.02;
    }

    if (p <= 0.02) {
      // Synchronize lookAt target with OrbitControls' active target
      if (orbitRef && orbitRef.current) {
        currentTarget.current.copy(orbitRef.current.target);
      }
      return;
    }

    const targetCamPos = new THREE.Vector3();
    const targetLookAt = new THREE.Vector3();

    // Retrieve active fish position (struggling snapper)
    const fishPos = fishPositionRef.current 
      ? fishPositionRef.current.clone() 
      : new THREE.Vector3(-1.4, -2.5, 1.0);

    if (p < 0.33) {
      // Phase 1: Zoom in towards the splash point above water, starting from sky position
      const t = p / 0.33;
      const easedT = THREE.MathUtils.smoothstep(t, 0, 1);
      
      targetCamPos.set(
        THREE.MathUtils.lerp(5, -0.6, easedT),
        THREE.MathUtils.lerp(4.5, -0.2, easedT),
        THREE.MathUtils.lerp(8, 3.8, easedT)
      );
      targetLookAt.set(
        THREE.MathUtils.lerp(0, -1.1, easedT),
        THREE.MathUtils.lerp(0, -0.45, easedT),
        THREE.MathUtils.lerp(0, 1.4, easedT)
      );
      
      // Sky/fog color for above water
      scene.fog = new THREE.FogExp2('#081714', 0.015);
    } else if (p < 0.66) {
      // Phase 2: Pass through water surface and lock onto the snapper fish
      const t = (p - 0.33) / 0.33;
      const easedT = THREE.MathUtils.smoothstep(t, 0, 1);
      
      targetCamPos.set(
        THREE.MathUtils.lerp(-0.6, fishPos.x - 0.5, easedT),
        THREE.MathUtils.lerp(-0.2, fishPos.y + 0.5, easedT),
        THREE.MathUtils.lerp(3.8, fishPos.z + 1.3, easedT)
      );
      targetLookAt.copy(fishPos);

      // Deep green underwater turbid fog
      scene.fog = new THREE.FogExp2('#081714', 0.18);
    } else {
      // Phase 3: Dive deeper into the Marine scene (bioluminescent forest)
      const t = (p - 0.66) / 0.34;
      const easedT = THREE.MathUtils.smoothstep(t, 0, 1);
      
      targetCamPos.set(
        THREE.MathUtils.lerp(fishPos.x - 0.5, 0.8, easedT),
        THREE.MathUtils.lerp(fishPos.y + 0.5, -7.4, easedT),
        THREE.MathUtils.lerp(fishPos.z + 1.3, 4.5, easedT)
      );
      targetLookAt.set(
        THREE.MathUtils.lerp(fishPos.x, 0.0, easedT),
        THREE.MathUtils.lerp(fishPos.y, -8.2, easedT),
        THREE.MathUtils.lerp(fishPos.z, -1.5, easedT)
      );

      // Deep dark sea fog
      scene.fog = new THREE.FogExp2('#040b0d', 0.16);
    }

    // Smoothly interpolate position and lookAt vectors
    camera.position.lerp(targetCamPos, 0.08);
    currentTarget.current.lerp(targetLookAt, 0.08);
    camera.lookAt(currentTarget.current);
  });

  return null;
};

function App() {
  const scrollProgress = useRef(0);
  const fishPositionRef = useRef(new THREE.Vector3(-1.4, -2.5, 1.0));
  const fishMouthPositionRef = useRef(new THREE.Vector3(-1.4, -2.5, 1.0));
  const orbitRef = useRef<any>(null);

  // Track window scroll progress (0 to 1)
  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress.current = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ width: '100vw', height: '330vh', position: 'relative' }}>
      {/* Fixed Canvas container */}
      <div 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          zIndex: 1,
          overflow: 'hidden'
        }}
      >
        <Canvas
          camera={{ position: [5, 4.5, 8], fov: 45 }}
          style={{ background: '#081714' }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffb26b" castShadow />
            
            <Sky 
              distance={450000} 
              sunPosition={[5, 0.4, 8]} // lower sun position for a soft sunset
              inclination={0} 
              azimuth={0.25} 
              rayleigh={3}
              turbidity={8}
              mieCoefficient={0.005}
            />
            
            <Environment preset="forest" />
            
            <CameraController scrollProgress={scrollProgress} fishPositionRef={fishPositionRef} orbitRef={orbitRef} />
            
            <OrbitControls
              ref={orbitRef}
              enableZoom={false}
              enablePan={false}
              autoRotate
              autoRotateSpeed={0.6}
              maxPolarAngle={Math.PI / 2 - 0.15} // Prevent looking completely below water
              minPolarAngle={Math.PI / 4} // Restrict camera height to sky-angled view
            />

            <Ocean />
            <Boat fishMouthPositionRef={fishMouthPositionRef} />
            <Underwater fishPositionRef={fishPositionRef} fishMouthPositionRef={fishMouthPositionRef} scrollProgress={scrollProgress} />
            <Marine scrollProgress={scrollProgress} />
            
            <ContactShadows position={[0, -0.9, 0]} opacity={0.5} scale={20} blur={2} far={4} />
          </Suspense>
        </Canvas>
      </div>

      {/* HTML Overlay with Hero fadeout */}
      <div style={{ position: 'relative', zIndex: 10, pointerEvents: 'none', height: '330vh' }}>
        <HeroOverlay />
      </div>
    </div>
  );
}

export default App;
