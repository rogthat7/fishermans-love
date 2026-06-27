import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface UnderwaterProps {
  fishPositionRef: React.RefObject<THREE.Vector3>;
  fishMouthPositionRef: React.RefObject<THREE.Vector3>;
  scrollProgress: React.RefObject<number>;
}

export const Underwater = ({ fishPositionRef, fishMouthPositionRef, scrollProgress }: UnderwaterProps) => {
  const fishRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Mesh>(null);
  const bubbleGroupRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Group>(null);

  // Generate seabed details (sand, rocks, seaweed)
  const seabed = useMemo(() => {
    const rocks = [];
    const seaweed = [];
    for (let i = 0; i < 20; i++) {
      rocks.push({
        pos: [(Math.random() - 0.5) * 20, -5.8, (Math.random() - 0.5) * 15 - 2],
        scale: [0.25 + Math.random() * 0.45, 0.15 + Math.random() * 0.3, 0.25 + Math.random() * 0.45],
        color: Math.random() > 0.5 ? '#4b5563' : '#374151',
      });
    }
    for (let i = 0; i < 25; i++) {
      seaweed.push({
        pos: [(Math.random() - 0.5) * 15, -5.7, (Math.random() - 0.5) * 12 - 2],
        scale: [0.08 + Math.random() * 0.08, 0.6 + Math.random() * 0.8, 0.08],
        color: Math.random() > 0.5 ? '#14532d' : '#166534',
        delay: Math.random() * Math.PI,
      });
    }
    return { rocks, seaweed };
  }, []);

  // Rising bubbles setup
  const bubbles = useMemo(() => {
    const list = [];
    for (let i = 0; i < 30; i++) {
      list.push({
        pos: new THREE.Vector3(
          -1.4 + (Math.random() - 0.5) * 2,
          -5.5 + Math.random() * 5,
          1.0 + (Math.random() - 0.5) * 2
        ),
        speed: 0.7 + Math.random() * 1.3,
        scale: 0.015 + Math.random() * 0.035,
      });
    }
    return list;
  }, []);

  // Generate a smooth, detailed custom 3D Snapper Fish Body
  const snapperGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    const segsLength = 35; // along Z (length)
    const segsWidth = 24;  // around the body (cross-section)

    const length = 0.85;
    const maxWidth = 0.16;
    const maxHeight = 0.38;

    for (let l = 0; l <= segsLength; l++) {
      const tL = l / segsLength;
      // Z goes from -length/2 (tail base) to length/2 (mouth tip)
      const z = (tL - 0.5) * length;

      // Snapper profile: deep body, tapered to nose and tail
      // Peak depth shifted slightly forward (tL ~ 0.58)
      const taper = Math.sin(tL * Math.PI);
      const profile = Math.pow(taper, 0.75) * (1.0 + 0.12 * Math.sin(tL * Math.PI * 1.5));
      
      const localWidth = maxWidth * profile;
      const localHeight = maxHeight * profile;

      for (let w = 0; w <= segsWidth; w++) {
        const tW = w / segsWidth;
        const angle = tW * Math.PI * 2;

        let x = Math.cos(angle) * localWidth * 0.5;
        let y = Math.sin(angle) * localHeight * 0.5;

        // Shape an open mouth cavity at the front of the fish
        if (tL > 0.91) {
          const mouthOpenness = (tL - 0.91) / 0.09; // 0 to 1
          const factorY = 0.08 * mouthOpenness;
          if (y > 0) {
            y += factorY * 0.22; // upper lip pulls up
          } else {
            y -= factorY * 0.22; // lower lip pulls down
          }
          // Flatten snout sides slightly
          x *= 0.75;
        }

        vertices.push(x, y, z);
        uvs.push(tW, tL);
      }
    }

    // Grid indices
    for (let l = 0; l < segsLength; l++) {
      for (let w = 0; w < segsWidth; w++) {
        const p0 = l * (segsWidth + 1) + w;
        const p1 = p0 + 1;
        const p2 = (l + 1) * (segsWidth + 1) + w;
        const p3 = p2 + 1;

        indices.push(p0, p1, p2);
        indices.push(p1, p3, p2);
      }
    }

    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    return geom;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    // Animate bubbles rising
    if (bubbleGroupRef.current) {
      bubbleGroupRef.current.children.forEach((child, idx) => {
        const bubble = bubbles[idx];
        if (bubble) {
          child.position.y += 0.02 * bubble.speed;
          child.position.x += Math.sin(t * 3.5 + idx) * 0.004;
          
          if (child.position.y > -0.45) {
            child.position.y = -5.5;
            if (fishPositionRef.current) {
              child.position.x = fishPositionRef.current.x + (Math.random() - 0.5) * 0.8;
              child.position.z = fishPositionRef.current.z + (Math.random() - 0.5) * 0.8;
            }
          }
        }
      });
    }

    // Animate snapper struggling
    if (fishRef.current && fishPositionRef.current) {
      const fishX = -1.4 + Math.sin(t * 5.0) * 0.65 + Math.cos(t * 2.2) * 0.25;
      const fishY = -2.6 + Math.sin(t * 3.8) * 0.35;
      const fishZ = 1.0 + Math.cos(t * 4.2) * 0.65 + Math.sin(t * 1.8) * 0.25;
      
      (fishPositionRef as React.MutableRefObject<THREE.Vector3>).current.set(fishX, fishY, fishZ);
      fishRef.current.position.copy(fishPositionRef.current);

      const nextX = -1.4 + Math.sin((t + 0.04) * 5.0) * 0.65 + Math.cos((t + 0.04) * 2.2) * 0.25;
      const nextZ = 1.0 + Math.cos((t + 0.04) * 4.2) * 0.65 + Math.sin((t + 0.04) * 1.8) * 0.25;
      
      const angle = Math.atan2(nextX - fishX, nextZ - fishZ);
      fishRef.current.rotation.y = angle + Math.PI; // Face forward
      
      fishRef.current.rotation.z = Math.sin(t * 15.0) * 0.3; // Roll
      fishRef.current.rotation.x = Math.cos(t * 9.0) * 0.18; // Pitch
    }

    // High frequency tail wiggle
    if (tailRef.current) {
      tailRef.current.rotation.y = Math.sin(t * 24.0) * 0.45;
    }

    // Update fish mouth world position ref for the fishing line
    if (mouthRef.current && fishMouthPositionRef.current) {
      mouthRef.current.getWorldPosition(fishMouthPositionRef.current);
    }

    // Toggle visibility based on scroll progress to optimize rendering
    if (groupRef.current) {
      groupRef.current.visible = (scrollProgress.current ?? 0) > 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Seabed floor */}
      <mesh position={[0, -5.8, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#142c26" roughness={0.9} flatShading />
      </mesh>

      {/* Seabed Rocks */}
      {seabed.rocks.map((rock, idx) => (
        <mesh key={`rock-${idx}`} position={rock.pos as any} scale={rock.scale as any} castShadow>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={rock.color} roughness={0.8} flatShading />
        </mesh>
      ))}

      {/* Seaweed */}
      {seabed.seaweed.map((weed, idx) => (
        <group key={`weed-${idx}`} position={weed.pos as any}>
          <mesh scale={weed.scale as any} castShadow>
            <cylinderGeometry args={[0.02, 0.04, 1, 4]} />
            <meshStandardMaterial color={weed.color} roughness={0.95} flatShading />
          </mesh>
        </group>
      ))}

      {/* Bubbles */}
      <group ref={bubbleGroupRef}>
        {bubbles.map((bubble, idx) => (
          <mesh key={`bubble-${idx}`} position={bubble.pos} scale={[bubble.scale, bubble.scale, bubble.scale]}>
            <sphereGeometry args={[1, 6, 6]} />
            <meshPhysicalMaterial 
              color="#ffffff" 
              transparent 
              opacity={0.3} 
              transmission={0.9}
              roughness={0.0} 
            />
          </mesh>
        ))}
      </group>

      <group ref={fishRef}>
        
        {/* Helper group at the fish mouth local coordinate to extract world position */}
        <group ref={mouthRef} position={[0, -0.04, 0.50]} />
        
        {/* Smooth Custom Snapper Body */}
        <mesh geometry={snapperGeometry} castShadow receiveShadow>
          <meshStandardMaterial color="#e74c3c" roughness={0.25} metalness={0.2} flatShading />
        </mesh>

        {/* Detailed Golden Snapper Eyes */}
        {/* Left Eye */}
        <group position={[-0.078, 0.08, 0.23]} rotation={[0, -Math.PI / 6, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.032, 12, 12]} />
            <meshStandardMaterial color="#f1c40f" roughness={0.1} metalness={0.8} /> {/* Golden iris */}
          </mesh>
          <mesh position={[0, 0, 0.018]}>
            <sphereGeometry args={[0.016, 8, 8]} />
            <meshStandardMaterial color="#000000" roughness={0.0} /> {/* Pupil */}
          </mesh>
        </group>
        
        {/* Right Eye */}
        <group position={[0.078, 0.08, 0.23]} rotation={[0, Math.PI / 6, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.032, 12, 12]} />
            <meshStandardMaterial color="#f1c40f" roughness={0.1} metalness={0.8} />
          </mesh>
          <mesh position={[0, 0, 0.018]}>
            <sphereGeometry args={[0.016, 8, 8]} />
            <meshStandardMaterial color="#000000" roughness={0.0} />
          </mesh>
        </group>

        {/* Gill Cover lines (Gill plates) */}
        <mesh position={[-0.076, 0, 0.12]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[0.01, 0.18, 0.02]} />
          <meshStandardMaterial color="#c0392b" roughness={0.4} />
        </mesh>
        <mesh position={[0.076, 0, 0.12]} rotation={[0, 0, -0.2]}>
          <boxGeometry args={[0.01, 0.18, 0.02]} />
          <meshStandardMaterial color="#c0392b" roughness={0.4} />
        </mesh>

        {/* Caudal (Tail) Fin - jointed, split V-shape */}
        <group ref={tailRef} position={[0, 0, -0.41]}>
          {/* Lobe upper */}
          <mesh position={[0, 0.1, -0.16]} rotation={[0.35, 0, 0]} castShadow>
            <boxGeometry args={[0.016, 0.14, 0.24]} />
            <meshStandardMaterial color="#c0392b" roughness={0.25} flatShading />
          </mesh>
          {/* Lobe lower */}
          <mesh position={[0, -0.1, -0.16]} rotation={[-0.35, 0, 0]} castShadow>
            <boxGeometry args={[0.016, 0.14, 0.24]} />
            <meshStandardMaterial color="#c0392b" roughness={0.25} flatShading />
          </mesh>
          {/* Tail root joint */}
          <mesh castShadow position={[0, 0, -0.04]}>
            <boxGeometry args={[0.06, 0.11, 0.12]} />
            <meshStandardMaterial color="#e74c3c" roughness={0.3} />
          </mesh>
        </group>

        {/* Pectoral Side Fins */}
        {/* Left Pectoral */}
        <mesh position={[-0.082, -0.06, 0.08]} rotation={[0.18, 0.35, -0.65]} castShadow>
          <coneGeometry args={[0.05, 0.24, 3]} />
          <meshStandardMaterial color="#c0392b" roughness={0.3} flatShading />
        </mesh>
        {/* Right Pectoral */}
        <mesh position={[0.082, -0.06, 0.08]} rotation={[0.18, -0.35, 0.65]} castShadow>
          <coneGeometry args={[0.05, 0.24, 3]} />
          <meshStandardMaterial color="#c0392b" roughness={0.3} flatShading />
        </mesh>

        {/* Spiny Dorsal Fin */}
        <group position={[0, 0.18, -0.05]}>
          {/* Thin fin sail */}
          <mesh castShadow rotation={[0.08, 0, 0]}>
            <boxGeometry args={[0.014, 0.16, 0.46]} />
            <meshStandardMaterial color="#c0392b" roughness={0.35} flatShading />
          </mesh>
          {/* Individual golden rays/spines */}
          {[0.16, 0.07, -0.02, -0.11, -0.2].map((zOffset, spineIdx) => (
            <mesh key={spineIdx} position={[0, 0.11, zOffset]} rotation={[0.25, 0, 0]}>
              <cylinderGeometry args={[0.004, 0.008, 0.13]} />
              <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
            </mesh>
          ))}
        </group>

        {/* Anal (Bottom Rear) Fin */}
        <mesh position={[0, -0.17, -0.2]} rotation={[-0.3, 0, 0]} castShadow>
          <boxGeometry args={[0.015, 0.09, 0.18]} />
          <meshStandardMaterial color="#c0392b" roughness={0.3} flatShading />
        </mesh>

      </group>

      {/* Underwater lights */}
      <ambientLight intensity={0.15} color="#1abc9c" />
      <directionalLight position={[0, 5, 0]} intensity={1.2} color="#16a085" />
      <spotLight position={[0, 4, 0]} intensity={5} distance={10} angle={0.7} penumbra={1} color="#3498db" />
    </group>
  );
};
