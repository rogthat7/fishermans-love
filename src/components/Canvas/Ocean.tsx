import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Ocean = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Gentle wave animation for the water surface
      meshRef.current.position.y = Math.sin(clock.elapsedTime * 0.5) * 0.1 - 0.5;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[100, 100, 64, 64]} />
      <meshStandardMaterial 
        color="#13322b" 
        roughness={0.12}
        metalness={0.8}
        envMapIntensity={1.2}
      />
    </mesh>
  );
};
