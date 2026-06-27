import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MarineProps {
  scrollProgress: React.RefObject<number>;
}

export const Marine = ({ scrollProgress }: MarineProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const bigFishShadowRef = useRef<THREE.Group>(null);
  const smallFishGroupRef = useRef<THREE.Group>(null);
  const carpRef = useRef<THREE.Group>(null);

  // Generate dense vegetation and corals
  const sceneData = useMemo(() => {
    const plants = [];
    const corals = [];
    const points = [];

    // Glowing kelp / seagrass (dense and tall)
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.5 + Math.random() * 5.0;
      plants.push({
        pos: [Math.cos(angle) * radius, -10.0, Math.sin(angle) * radius - 1.5],
        scale: [0.12 + Math.random() * 0.12, 3.5 + Math.random() * 3.0, 0.12],
        emissive: Math.random() > 0.4 ? '#1abc9c' : '#2ecc71',
        speed: 0.8 + Math.random() * 1.0,
        phase: Math.random() * Math.PI,
      });
    }

    // Glowing staghorn corals (larger and more detailed)
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.0 + Math.random() * 4.5;
      const colorType = Math.random() > 0.5;
      corals.push({
        pos: [Math.cos(angle) * radius, -9.8, Math.sin(angle) * radius - 2.0],
        scale: [0.15 + Math.random() * 0.1, 1.2 + Math.random() * 1.0, 0.15 + Math.random() * 0.1],
        color: colorType ? '#ec7063' : '#5dade2',
        emissive: colorType ? '#e74c3c' : '#2980b9',
        rotation: [Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.3],
      });
    }

    // Positions for small neon fish school
    const school = [];
    for (let i = 0; i < 20; i++) {
      school.push({
        offset: new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          -8.0 + (Math.random() - 0.5) * 1.5,
          -1.5 + (Math.random() - 0.5) * 4
        ),
        speed: 1.2 + Math.random() * 0.8,
        scale: 0.04 + Math.random() * 0.04,
        color: Math.random() > 0.6 ? '#00ffff' : '#ff00ff',
      });
    }

    // Small glowing points (bioluminescent embers)
    for (let i = 0; i < 20; i++) {
      points.push({
        pos: [(Math.random() - 0.5) * 10, -9.5 + Math.random() * 3, -2 + (Math.random() - 0.5) * 7],
        color: Math.random() > 0.5 ? '#1abc9c' : '#f1c40f',
        speed: 0.3 + Math.random() * 0.5,
      });
    }

    return { plants, corals, school, points };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    // Toggle visibility based on scroll depth (Page 3 active at scroll progress > 0.5)
    if (groupRef.current) {
      groupRef.current.visible = (scrollProgress.current ?? 0) > 0.52;
    }

    // Animate glowing kelp swaying gently in current
    if (groupRef.current && groupRef.current.visible) {
      const children = groupRef.current.children;
      sceneData.plants.forEach((plant, idx) => {
        // Kelp meshes are under the first group (or offset index)
        const mesh = children[idx] as THREE.Mesh;
        if (mesh && mesh.rotation) {
          mesh.rotation.z = Math.sin(t * 1.0 * plant.speed + plant.phase) * 0.08;
          mesh.rotation.x = Math.cos(t * 0.6 * plant.speed + plant.phase) * 0.04;
        }
      });

      // Animate distant shadow fish gliding through fog
      if (bigFishShadowRef.current) {
        // Slow continuous glide in the distance
        bigFishShadowRef.current.position.x = Math.sin(t * 0.08) * 12.0;
        bigFishShadowRef.current.position.y = -7.5 + Math.sin(t * 0.2) * 0.5;
        
        // Face gliding direction
        const facingDir = Math.cos(t * 0.08);
        bigFishShadowRef.current.rotation.y = facingDir > 0 ? Math.PI / 2 : -Math.PI / 2;
        
        // Shark tail wiggle (Caudal Fin is child index 4)
        const tailJoint = bigFishShadowRef.current.children[4] as THREE.Mesh;
        if (tailJoint) {
          tailJoint.rotation.y = Math.sin(t * 2.5) * 0.25;
        }
      }

      // Animate neon fish school swimming in circles
      if (smallFishGroupRef.current) {
        smallFishGroupRef.current.children.forEach((fishGroup, idx) => {
          const fish = sceneData.school[idx];
          if (fish) {
            // Circular path around center
            const orbitRadius = 3.0;
            const orbitAngle = t * 0.4 * fish.speed + idx * 0.4;
            const x = Math.cos(orbitAngle) * orbitRadius + fish.offset.x * 0.3;
            const z = Math.sin(orbitAngle) * orbitRadius + fish.offset.z * 0.3;
            const y = fish.offset.y + Math.sin(t * 1.2 + idx) * 0.1;

            fishGroup.position.set(x, y, z);
            
            // Tangent rotation
            fishGroup.rotation.y = -orbitAngle + Math.PI / 2;
            
            // Swim roll
            fishGroup.rotation.z = Math.sin(t * 10 + idx) * 0.2;
            
            // School fish tail wiggle (Caudal Fin is child index 1)
            const tailMesh = fishGroup.children[1] as THREE.Mesh;
            if (tailMesh) {
              tailMesh.rotation.y = Math.sin(t * 18 + idx) * 0.35;
            }
          }
        });
      }

      // Animate big carp gliding left to right (in the foreground)
      if (carpRef.current) {
        const startX = -7.5;
        const endX = 7.5;
        const speed = 0.5;
        const carpTime = (t * speed) % (endX - startX);
        const x = startX + carpTime;

        carpRef.current.position.set(x, -8.3, 0.8);
        carpRef.current.rotation.y = Math.PI / 2; // Always face right

        // Gentle body roll while swimming
        carpRef.current.rotation.z = Math.sin(t * 5.5) * 0.08;

        // Body wave undulation — tail peduncle (child 10)
        const peduncle = carpRef.current.children[10] as THREE.Mesh;
        if (peduncle) peduncle.rotation.y = Math.sin(t * 7.5) * 0.28;

        // Forked tail — upper lobe (child 13) and lower lobe (child 14)
        const tailUpper = carpRef.current.children[13] as THREE.Mesh;
        const tailLower = carpRef.current.children[14] as THREE.Mesh;
        const tailWag = Math.sin(t * 7.5) * 0.38;
        if (tailUpper) tailUpper.rotation.y = tailWag;
        if (tailLower) tailLower.rotation.y = tailWag;

        // Pectoral fin flap (children 15 and 16)
        const pectL = carpRef.current.children[15] as THREE.Mesh;
        const pectR = carpRef.current.children[16] as THREE.Mesh;
        const pectFlap = Math.sin(t * 5.0) * 0.22;
        if (pectL) pectL.rotation.z = -0.55 + pectFlap;
        if (pectR) pectR.rotation.z = 0.55 - pectFlap;
      }
    }
  });

  return (
    <group ref={groupRef}>
      
      {/* Deep seabed floor */}
      <mesh position={[0, -10.0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#051214" roughness={0.95} flatShading />
      </mesh>

      {/* Bioluminescent Kelp / Seagrass */}
      {sceneData.plants.map((plant, idx) => (
        <mesh 
          key={`kelp-${idx}`} 
          position={plant.pos as any} 
          scale={plant.scale as any}
          castShadow
        >
          <cylinderGeometry args={[0.02, 0.05, 1, 5]} />
          <meshStandardMaterial 
            color="#083e35" 
            emissive={plant.emissive} 
            emissiveIntensity={1.8} 
            roughness={0.8} 
            flatShading
          />
        </mesh>
      ))}

      {/* Staghorn Corals */}
      {sceneData.corals.map((coral, idx) => (
        <group key={`coral-${idx}`} position={coral.pos as any} rotation={coral.rotation as any}>
          {/* Main stem */}
          <mesh scale={coral.scale as any} castShadow>
            <cylinderGeometry args={[0.03, 0.06, 1, 5]} />
            <meshStandardMaterial color={coral.color} emissive={coral.emissive} emissiveIntensity={2.0} flatShading />
          </mesh>
          {/* Branch 1 */}
          <mesh 
            position={[0.06, 0.15, 0]} 
            rotation={[0, 0, 0.6]} 
            scale={[coral.scale[0], coral.scale[1] * 0.6, coral.scale[2]]}
            castShadow
          >
            <cylinderGeometry args={[0.02, 0.04, 1, 5]} />
            <meshStandardMaterial color={coral.color} emissive={coral.emissive} emissiveIntensity={2.0} flatShading />
          </mesh>
          {/* Branch 2 */}
          <mesh 
            position={[-0.06, 0.25, 0]} 
            rotation={[0, 0, -0.6]} 
            scale={[coral.scale[0], coral.scale[1] * 0.5, coral.scale[2]]}
            castShadow
          >
            <cylinderGeometry args={[0.015, 0.03, 1, 5]} />
            <meshStandardMaterial color={coral.color} emissive={coral.emissive} emissiveIntensity={2.0} flatShading />
          </mesh>
        </group>
      ))}

      {/* Distant giant fish silhouette (shadow of a big shark in the distance) */}
      <group ref={bigFishShadowRef} position={[0, -7.5, -14.0]}>
        {/* Torpedo center body (Child 0) */}
        <mesh>
          <sphereGeometry args={[1, 6, 8]} />
          <meshStandardMaterial color="#010405" roughness={1.0} flatShading />
        </mesh>
        {/* Pointed head (Child 1) */}
        <mesh position={[0, 0, 1.4]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[1, 1.6, 6]} />
          <meshStandardMaterial color="#010405" roughness={1.0} flatShading />
        </mesh>
        {/* Tapered tail (Child 2) */}
        <mesh position={[0, 0, -1.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[1, 1.8, 6]} />
          <meshStandardMaterial color="#010405" roughness={1.0} flatShading />
        </mesh>
        {/* Shark dorsal fin (Child 3) */}
        <mesh position={[0, 1.1, -0.2]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[0.15, 1.2, 0.8]} />
          <meshStandardMaterial color="#010405" roughness={1.0} flatShading />
        </mesh>
        {/* Giant vertical tail fin (Child 4) */}
        <mesh position={[0, 0, -2.6]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.1, 2.5, 1.0]} />
          <meshStandardMaterial color="#010405" roughness={1.0} flatShading />
        </mesh>
        {/* Pectoral left (Child 5) */}
        <mesh position={[1.2, -0.2, 0.6]} rotation={[0.2, 0, -0.6]}>
          <boxGeometry args={[1.5, 0.15, 0.8]} />
          <meshStandardMaterial color="#010405" roughness={1.0} flatShading />
        </mesh>
        {/* Pectoral right (Child 6) */}
        <mesh position={[-1.2, -0.2, 0.6]} rotation={[0.2, 0, 0.6]}>
          <boxGeometry args={[1.5, 0.15, 0.8]} />
          <meshStandardMaterial color="#010405" roughness={1.0} flatShading />
        </mesh>
      </group>

      {/* School of glowing neon tetras */}
      <group ref={smallFishGroupRef}>
        {sceneData.school.map((fish, idx) => (
          <group key={`neon-${idx}`} scale={[fish.scale * 1.5, fish.scale * 1.5, fish.scale * 1.5]}>
            {/* Tapered almond body (Child 0) */}
            <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.3, 1.2, 4]} />
              <meshStandardMaterial color={fish.color} emissive={fish.color} emissiveIntensity={3.0} flatShading />
            </mesh>
            {/* Caudal tail fin (Child 1) */}
            <mesh position={[0, 0, -0.7]}>
              <boxGeometry args={[0.04, 0.5, 0.3]} />
              <meshStandardMaterial color={fish.color} emissive={fish.color} emissiveIntensity={3.0} flatShading />
            </mesh>
            {/* Left pectoral fin (Child 2) */}
            <mesh position={[0.25, 0, 0.2]} rotation={[0, 0.4, -0.3]}>
              <boxGeometry args={[0.2, 0.03, 0.15]} />
              <meshStandardMaterial color={fish.color} emissive={fish.color} emissiveIntensity={3.0} flatShading />
            </mesh>
            {/* Right pectoral fin (Child 3) */}
            <mesh position={[-0.25, 0, 0.2]} rotation={[0, -0.4, 0.3]}>
              <boxGeometry args={[0.2, 0.03, 0.15]} />
              <meshStandardMaterial color={fish.color} emissive={fish.color} emissiveIntensity={3.0} flatShading />
            </mesh>
          </group>
        ))}
      </group>

      {/* =====================================================
          BIG DETAILED CARP - swimming left to right
          ===================================================== */}
      <group ref={carpRef} position={[-6.5, -8.3, 0.8]}>

        {/* === BODY === */}
        {/* Main mid-body (fat rounded torso) - Child 0 */}
        <mesh castShadow scale={[0.72, 0.55, 1.1]}>
          <sphereGeometry args={[1, 12, 10]} />
          <meshStandardMaterial color="#c0540a" roughness={0.25} metalness={0.25} emissive="#f07020" emissiveIntensity={0.55} />
        </mesh>

        {/* Pale belly highlight - Child 1 */}
        <mesh position={[0, -0.42, 0.1]} scale={[0.55, 0.18, 0.9]}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial color="#f5c878" roughness={0.3} emissive="#f5c878" emissiveIntensity={0.3} />
        </mesh>

        {/* Gill plate right (operculum) - Child 2 */}
        <mesh position={[0.68, 0.05, 0.72]} rotation={[0.1, -0.4, 0.05]} scale={[0.22, 0.34, 0.18]}>
          <sphereGeometry args={[1, 6, 5]} />
          <meshStandardMaterial color="#b84d08" roughness={0.2} metalness={0.3} emissive="#e06010" emissiveIntensity={0.4} flatShading />
        </mesh>

        {/* Gill plate left (operculum) - Child 3 */}
        <mesh position={[-0.68, 0.05, 0.72]} rotation={[0.1, 0.4, 0.05]} scale={[0.22, 0.34, 0.18]}>
          <sphereGeometry args={[1, 6, 5]} />
          <meshStandardMaterial color="#b84d08" roughness={0.2} metalness={0.3} emissive="#e06010" emissiveIntensity={0.4} flatShading />
        </mesh>

        {/* === HEAD === */}
        {/* Blunt rounded head - Child 4 */}
        <mesh position={[0, 0.05, 1.05]} scale={[0.6, 0.5, 0.52]} castShadow>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color="#c0540a" roughness={0.25} metalness={0.2} emissive="#f07020" emissiveIntensity={0.5} />
        </mesh>

        {/* Protruding mouth (carp downward-facing lips) - Child 5 */}
        <mesh position={[0, -0.18, 1.55]} rotation={[Math.PI / 2, 0, 0]} scale={[0.12, 0.07, 0.12]}>
          <cylinderGeometry args={[1, 0.8, 1, 8]} />
          <meshStandardMaterial color="#8b2500" roughness={0.5} />
        </mesh>

        {/* Eye right - Child 6 */}
        <mesh position={[0.52, 0.14, 1.2]}>
          <sphereGeometry args={[0.085, 8, 8]} />
          <meshBasicMaterial color="#1a0a00" />
        </mesh>
        {/* Eye shine right - Child 7 */}
        <mesh position={[0.56, 0.17, 1.24]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* Eye left - Child 8 */}
        <mesh position={[-0.52, 0.14, 1.2]}>
          <sphereGeometry args={[0.085, 8, 8]} />
          <meshBasicMaterial color="#1a0a00" />
        </mesh>
        {/* Eye shine left - Child 9 */}
        <mesh position={[-0.56, 0.17, 1.24]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* Tail peduncle (narrow caudal connector) - Child 10 */}
        <mesh position={[0, 0.04, -1.15]} scale={[0.3, 0.28, 0.55]} castShadow>
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial color="#b84d08" roughness={0.3} emissive="#e06820" emissiveIntensity={0.45} />
        </mesh>

        {/* === FINS === */}
        {/* Long sweeping dorsal fin - Child 11 */}
        <mesh position={[0, 0.62, -0.1]} rotation={[0.05, 0, 0]} scale={[0.03, 1, 2.2]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#e07818" roughness={0.35} emissive="#e07818" emissiveIntensity={0.5} flatShading />
        </mesh>

        {/* Dorsal leading-edge spine - Child 12 */}
        <mesh position={[0, 0.78, 0.65]} rotation={[-0.28, 0, 0]}>
          <boxGeometry args={[0.04, 0.42, 0.06]} />
          <meshStandardMaterial color="#f08020" roughness={0.2} />
        </mesh>

        {/* Forked caudal tail upper lobe - Child 13 */}
        <mesh position={[0, 0.34, -1.75]} rotation={[0.45, 0, 0]}>
          <boxGeometry args={[0.05, 0.72, 0.58]} />
          <meshStandardMaterial color="#e07818" roughness={0.3} emissive="#e07818" emissiveIntensity={0.5} flatShading />
        </mesh>

        {/* Forked caudal tail lower lobe - Child 14 */}
        <mesh position={[0, -0.28, -1.75]} rotation={[-0.45, 0, 0]}>
          <boxGeometry args={[0.05, 0.62, 0.52]} />
          <meshStandardMaterial color="#d06010" roughness={0.3} emissive="#d06010" emissiveIntensity={0.5} flatShading />
        </mesh>

        {/* Right pectoral fin (large paddle) - Child 15 */}
        <mesh position={[0.72, -0.12, 0.62]} rotation={[0.15, -0.2, -0.55]}>
          <boxGeometry args={[0.55, 0.05, 0.38]} />
          <meshStandardMaterial color="#e07818" roughness={0.3} emissive="#e07818" emissiveIntensity={0.45} flatShading />
        </mesh>

        {/* Left pectoral fin - Child 16 */}
        <mesh position={[-0.72, -0.12, 0.62]} rotation={[0.15, 0.2, 0.55]}>
          <boxGeometry args={[0.55, 0.05, 0.38]} />
          <meshStandardMaterial color="#e07818" roughness={0.3} emissive="#e07818" emissiveIntensity={0.45} flatShading />
        </mesh>

        {/* Right ventral / pelvic fin - Child 17 */}
        <mesh position={[0.35, -0.52, 0.1]} rotation={[0.5, 0.1, -0.6]}>
          <boxGeometry args={[0.35, 0.04, 0.25]} />
          <meshStandardMaterial color="#c85e10" roughness={0.4} emissive="#c85e10" emissiveIntensity={0.35} flatShading />
        </mesh>

        {/* Left ventral / pelvic fin - Child 18 */}
        <mesh position={[-0.35, -0.52, 0.1]} rotation={[0.5, -0.1, 0.6]}>
          <boxGeometry args={[0.35, 0.04, 0.25]} />
          <meshStandardMaterial color="#c85e10" roughness={0.4} emissive="#c85e10" emissiveIntensity={0.35} flatShading />
        </mesh>

        {/* Anal fin (bottom rear) - Child 19 */}
        <mesh position={[0, -0.55, -0.7]} rotation={[0.7, 0, 0]}>
          <boxGeometry args={[0.04, 0.28, 0.42]} />
          <meshStandardMaterial color="#c85e10" roughness={0.4} emissive="#c85e10" emissiveIntensity={0.3} flatShading />
        </mesh>

        {/* === BARBELS (4 golden whiskers) === */}
        {/* Upper-right barbel - Child 20 */}
        <mesh position={[0.18, -0.1, 1.52]} rotation={[0.55, 0.25, -0.35]}>
          <cylinderGeometry args={[0.018, 0.004, 0.52, 6]} />
          <meshBasicMaterial color="#f5c41a" />
        </mesh>
        {/* Upper-left barbel - Child 21 */}
        <mesh position={[-0.18, -0.1, 1.52]} rotation={[0.55, -0.25, 0.35]}>
          <cylinderGeometry args={[0.018, 0.004, 0.52, 6]} />
          <meshBasicMaterial color="#f5c41a" />
        </mesh>
        {/* Lower-right corner barbel - Child 22 */}
        <mesh position={[0.26, -0.22, 1.48]} rotation={[0.75, 0.3, -0.5]}>
          <cylinderGeometry args={[0.013, 0.003, 0.38, 6]} />
          <meshBasicMaterial color="#e8b010" />
        </mesh>
        {/* Lower-left corner barbel - Child 23 */}
        <mesh position={[-0.26, -0.22, 1.48]} rotation={[0.75, -0.3, 0.5]}>
          <cylinderGeometry args={[0.013, 0.003, 0.38, 6]} />
          <meshBasicMaterial color="#e8b010" />
        </mesh>

        {/* === SCALE HIGHLIGHTS (raised disc overlays) === */}
        <mesh position={[0.65, 0.18, 0.3]} rotation={[0.1, -0.5, 0.2]} scale={[0.18, 0.12, 0.04]}>
          <sphereGeometry args={[1, 5, 4]} />
          <meshStandardMaterial color="#e07028" roughness={0.2} metalness={0.4} emissive="#f08030" emissiveIntensity={0.6} flatShading />
        </mesh>
        <mesh position={[0.7, 0.05, -0.1]} rotation={[0.05, -0.5, 0.1]} scale={[0.18, 0.12, 0.04]}>
          <sphereGeometry args={[1, 5, 4]} />
          <meshStandardMaterial color="#e07028" roughness={0.2} metalness={0.4} emissive="#f08030" emissiveIntensity={0.6} flatShading />
        </mesh>
        <mesh position={[0.66, -0.1, -0.5]} rotation={[0.0, -0.5, 0.0]} scale={[0.18, 0.12, 0.04]}>
          <sphereGeometry args={[1, 5, 4]} />
          <meshStandardMaterial color="#e07028" roughness={0.2} metalness={0.4} emissive="#f08030" emissiveIntensity={0.6} flatShading />
        </mesh>
        <mesh position={[-0.65, 0.18, 0.3]} rotation={[0.1, 0.5, -0.2]} scale={[0.18, 0.12, 0.04]}>
          <sphereGeometry args={[1, 5, 4]} />
          <meshStandardMaterial color="#e07028" roughness={0.2} metalness={0.4} emissive="#f08030" emissiveIntensity={0.6} flatShading />
        </mesh>
        <mesh position={[-0.7, 0.05, -0.1]} rotation={[0.05, 0.5, -0.1]} scale={[0.18, 0.12, 0.04]}>
          <sphereGeometry args={[1, 5, 4]} />
          <meshStandardMaterial color="#e07028" roughness={0.2} metalness={0.4} emissive="#f08030" emissiveIntensity={0.6} flatShading />
        </mesh>
        <mesh position={[-0.66, -0.1, -0.5]} rotation={[0.0, 0.5, 0.0]} scale={[0.18, 0.12, 0.04]}>
          <sphereGeometry args={[1, 5, 4]} />
          <meshStandardMaterial color="#e07028" roughness={0.2} metalness={0.4} emissive="#f08030" emissiveIntensity={0.6} flatShading />
        </mesh>

      </group>

      {/* Floating Bioluminescent Embers */}
      {sceneData.points.map((pt, idx) => (
        <mesh 
          key={`ember-${idx}`} 
          position={pt.pos as any}
          scale={[0.025, 0.025, 0.025]}
        >
          <sphereGeometry args={[1, 4, 4]} />
          <meshBasicMaterial color={pt.color} />
        </mesh>
      ))}

      {/* Powerful Bioluminescent colored accent lights to illuminate floor */}
      <pointLight position={[-2, -9.0, -1]} color="#1abc9c" intensity={25} distance={12} />
      <pointLight position={[3, -9.0, -2]} color="#9b59b6" intensity={20} distance={10} />
      <pointLight position={[0, -8.5, -4]} color="#ff4d4d" intensity={22} distance={12} />

      {/* Spotlight pointing down for deep water sun rays */}
      <spotLight 
        position={[0, -5, -2]} 
        color="#1abc9c" 
        intensity={35} 
        distance={15} 
        angle={1.2} 
        penumbra={0.8} 
      />

      {/* Ambient dark blue deep sea lighting */}
      <directionalLight position={[0, -2, -5]} intensity={1.5} color="#001829" />
    </group>
  );
};
