import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BoatProps {
  fishMouthPositionRef: React.RefObject<THREE.Vector3>;
}

export const Boat = ({ fishMouthPositionRef }: BoatProps) => {
  const group = useRef<THREE.Group>(null);
  
  // Animation Refs
  const companionRodRef = useRef<THREE.Group>(null);
  const fishermanLineRef = useRef<THREE.Mesh>(null);
  const companionLineRef = useRef<THREE.Mesh>(null);
  const fishermanRippleRef = useRef<THREE.Mesh>(null);
  const companionRippleRef = useRef<THREE.Mesh>(null);
  const leapingFishRef = useRef<THREE.Group>(null);

  // Update line helper function to stretch cylinder between A and B
  const updateLine = (lineMesh: THREE.Mesh | null, posA: THREE.Vector3, posB: THREE.Vector3) => {
    if (!lineMesh) return;
    
    // Position at midpoint
    const midpoint = new THREE.Vector3().addVectors(posA, posB).multiplyScalar(0.5);
    lineMesh.position.copy(midpoint);
    
    // Scale length (Y-axis) to match distance
    const distance = posA.distanceTo(posB);
    lineMesh.scale.set(1, distance, 1);
    
    // Rotate cylinder to point from A to B
    const direction = new THREE.Vector3().subVectors(posB, posA).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
    lineMesh.quaternion.copy(quaternion);
  };

  useFrame(({ clock }) => {
    if (group.current) {
      const t = clock.elapsedTime;
      
      // Simulate boat rocking on waves
      group.current.position.y = Math.sin(t * 0.5) * 0.1 - 0.05;
      group.current.rotation.z = Math.sin(t * 0.8) * 0.03; // Roll
      group.current.rotation.x = Math.sin(t * 0.4) * 0.02; // Pitch
      group.current.rotation.y = Math.sin(t * 0.2) * 0.02; // Yaw drift

      // High frequency twitching for companion's rod (simulating hooked struggle)
      const tugX = Math.sin(t * 16) * 0.025 + Math.cos(t * 9) * 0.01;
      const tugZ = Math.sin(t * 13) * 0.015;
      if (companionRodRef.current) {
        companionRodRef.current.rotation.x = 0.45 + tugX;
        companionRodRef.current.rotation.z = -0.3 + tugZ;
      }

      // 1. Update Fisherman's Line
      const fRodBase = new THREE.Vector3(0.14, 0.22, -1.2);
      const fRodEuler = new THREE.Euler(0.45, 0.15, 0.35, 'XYZ');
      const fLocalTip = new THREE.Vector3(0, 1.55, 0).applyEuler(fRodEuler);
      const fTip = fRodBase.add(fLocalTip);

      const fEntry = new THREE.Vector3(
        0.9 + Math.sin(t * 0.4) * 0.04,
        -0.45,
        2.6 + Math.cos(t * 0.5) * 0.04
      );
      updateLine(fishermanLineRef.current, fTip, fEntry);
      
      if (fishermanRippleRef.current) {
        fishermanRippleRef.current.position.copy(fEntry);
        const fScale = 1 + Math.sin(t * 2) * 0.15;
        fishermanRippleRef.current.scale.set(fScale, fScale, 1);
      }

      // 2. Update Companion's Line (Hooked & swimming around erratically)
      const cRodBase = new THREE.Vector3(-0.12, 0.28, 1.22);
      const cRodEuler = new THREE.Euler(0.45 + tugX, -2.4, -0.3 + tugZ, 'XYZ');
      const cLocalTip = new THREE.Vector3(0, 1.55, 0).applyEuler(cRodEuler);
      const cTip = cRodBase.add(cLocalTip);

      // Read fish mouth world position directly from the tracking ref
      const fishMouth = fishMouthPositionRef.current ?? new THREE.Vector3(-1.4, -2.5, 1.0);
      updateLine(companionLineRef.current, cTip, fishMouth);

      // Compute intersection of the tight line with the water surface at y = -0.45
      const dy = fishMouth.y - cTip.y;
      const cEntry = new THREE.Vector3();
      if (Math.abs(dy) > 0.01) {
        const tIntersect = (-0.45 - cTip.y) / dy;
        cEntry.copy(cTip).lerp(fishMouth, tIntersect);
      } else {
        cEntry.set(fishMouth.x, -0.45, fishMouth.z);
      }

      if (companionRippleRef.current) {
        companionRippleRef.current.position.copy(cEntry);
        const cScale = 1.2 + Math.sin(t * 10) * 0.3;
        companionRippleRef.current.scale.set(cScale, cScale, 1);
      }

      // 3. Leaping Fish arc
      const jumpCycle = 4.0;
      const jumpDuration = 0.8;
      const cycleTime = t % jumpCycle;
      if (leapingFishRef.current) {
        if (cycleTime < jumpDuration) {
          leapingFishRef.current.visible = true;
          const alpha = cycleTime / jumpDuration;
          
          const startPt = cEntry;
          const endPt = new THREE.Vector3(cEntry.x + 0.4, -0.45, cEntry.z - 0.3);
          const currentPos = new THREE.Vector3().lerpVectors(startPt, endPt, alpha);
          currentPos.y = -0.45 + Math.sin(alpha * Math.PI) * 0.45; // arc height
          
          leapingFishRef.current.position.copy(currentPos);
          
          // Align body rotation with the trajectory arc
          const trajectoryAngle = alpha * Math.PI - Math.PI / 2;
          leapingFishRef.current.rotation.x = trajectoryAngle;
          leapingFishRef.current.rotation.z = Math.sin(t * 18) * 0.25; // Fish wiggling tail
        } else {
          leapingFishRef.current.visible = false;
        }
      }
    }
  });

  // Generate Canoe Hull Geometry
  const canoeGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    const segsLength = 40; // along Z (length)
    const segsWidth = 20;  // along the curve (from left gunwale to right gunwale)

    const length = 5.0;
    const maxWidth = 0.85;
    const maxDepth = 0.42;
    const bowRise = 0.35; // rise at the ends (bow & stern)

    for (let l = 0; l <= segsLength; l++) {
      const tL = l / segsLength;
      // Z goes from -length/2 (stern) to length/2 (bow)
      const z = (tL - 0.5) * length;
      
      // Parabolic taper for width: 0 at ends, 1 in the middle
      const widthFactor = Math.sin(tL * Math.PI);
      const localWidth = maxWidth * widthFactor;
      
      // Depth also tapers slightly towards the ends
      const localDepth = maxDepth * Math.sin(tL * Math.PI);
      
      // Keel and gunwales rise at the bow/stern
      const localKeelRise = bowRise * Math.pow(Math.abs(tL - 0.5) * 2, 2.5);
      const localGunwaleRise = bowRise * Math.pow(Math.abs(tL - 0.5) * 2, 2.0);

      for (let w = 0; w <= segsWidth; w++) {
        const tW = w / segsWidth;
        const angle = (tW - 0.5) * Math.PI; // -PI/2 to PI/2
        
        // X curves from -localWidth to +localWidth
        const x = Math.sin(angle) * localWidth;
        
        // Y curves down from localGunwaleRise to (-localDepth + localKeelRise) and back up
        const cosVal = Math.cos(angle);
        const keelY = -localDepth + localKeelRise;
        const gunwaleY = localGunwaleRise;
        
        const y = keelY * cosVal + gunwaleY * (1 - cosVal);

        vertices.push(x, y, z);
        uvs.push(tW, tL);
      }
    }

    // Indices for grid
    for (let l = 0; l < segsLength; l++) {
      for (let w = 0; w < segsWidth; w++) {
        const p0 = l * (segsWidth + 1) + w;
        const p1 = p0 + 1;
        const p2 = (l + 1) * (segsWidth + 1) + w;
        const p3 = p2 + 1;

        // Two triangles
        indices.push(p0, p2, p1);
        indices.push(p1, p2, p3);
      }
    }

    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    return geom;
  }, []);

  // Left and Right Gunwale Paths for rendering the wooden rim
  const gunwales = useMemo(() => {
    const leftPoints: THREE.Vector3[] = [];
    const rightPoints: THREE.Vector3[] = [];
    const steps = 30;
    const length = 5.0;
    const maxWidth = 0.85;
    const bowRise = 0.35;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const z = (t - 0.5) * length;
      const widthFactor = Math.sin(t * Math.PI);
      const localWidth = maxWidth * widthFactor;
      const localGunwaleRise = bowRise * Math.pow(Math.abs(t - 0.5) * 2, 2.0);

      leftPoints.push(new THREE.Vector3(-localWidth, localGunwaleRise, z));
      rightPoints.push(new THREE.Vector3(localWidth, localGunwaleRise, z));
    }

    return {
      left: new THREE.CatmullRomCurve3(leftPoints),
      right: new THREE.CatmullRomCurve3(rightPoints),
    };
  }, []);

  // Ribs (hull reinforcement structures) along the length of the canoe
  const ribs = useMemo(() => {
    const ribPositions = [-1.8, -1.2, -0.6, 0, 0.6, 1.2, 1.8];
    const length = 5.0;
    const maxWidth = 0.85;
    const maxDepth = 0.42;
    const bowRise = 0.35;
    const segsWidth = 20;

    return ribPositions.map((zPos) => {
      const tL = (zPos / length) + 0.5;
      const localWidth = maxWidth * Math.sin(tL * Math.PI);
      const localDepth = maxDepth * Math.sin(tL * Math.PI);
      const localKeelRise = bowRise * Math.pow(Math.abs(tL - 0.5) * 2, 2.5);
      const localGunwaleRise = bowRise * Math.pow(Math.abs(tL - 0.5) * 2, 2.0);

      const points: THREE.Vector3[] = [];
      for (let w = 0; w <= segsWidth; w++) {
        const tW = w / segsWidth;
        const angle = (tW - 0.5) * Math.PI;
        const x = Math.sin(angle) * localWidth;
        const cosVal = Math.cos(angle);
        const keelY = -localDepth + localKeelRise;
        const gunwaleY = localGunwaleRise;
        // Shift slightly inward to avoid z-fighting with the hull
        const y = (keelY * cosVal + gunwaleY * (1 - cosVal)) * 0.99;
        points.push(new THREE.Vector3(x, y, zPos));
      }
      return new THREE.CatmullRomCurve3(points);
    });
  }, []);

  return (
    <group ref={group}>
      {/* Sunset glow point light inside the canoe for warm illumination */}
      <pointLight position={[0, 0.5, 0]} color="#ff7a00" intensity={1.8} distance={10} />

      {/* Main Canoe Hull */}
      {/* Outer Hull: rich dark mahogany */}
      <mesh geometry={canoeGeometry} castShadow receiveShadow>
        <meshStandardMaterial 
          color="#5a2c16" 
          roughness={0.15} 
          metalness={0.1} 
          side={THREE.FrontSide} 
        />
      </mesh>
      
      {/* Inner Hull: lighter ash/birch wood */}
      <mesh geometry={canoeGeometry} castShadow receiveShadow scale={[0.995, 0.995, 0.995]}>
        <meshStandardMaterial 
          color="#d2b48c" 
          roughness={0.4} 
          metalness={0.0} 
          side={THREE.BackSide} 
        />
      </mesh>

      {/* Gunwales (Rim) */}
      <mesh castShadow receiveShadow>
        <tubeGeometry args={[gunwales.left, 40, 0.025, 8, false]} />
        <meshStandardMaterial color="#4a2211" roughness={0.3} />
      </mesh>
      <mesh castShadow receiveShadow>
        <tubeGeometry args={[gunwales.right, 40, 0.025, 8, false]} />
        <meshStandardMaterial color="#4a2211" roughness={0.3} />
      </mesh>

      {/* Ribs (Wooden support arches inside the canoe) */}
      {ribs.map((ribCurve, index) => (
        <mesh key={index} castShadow>
          <tubeGeometry args={[ribCurve, 20, 0.012, 6, false]} />
          <meshStandardMaterial color="#b59469" roughness={0.5} />
        </mesh>
      ))}

      {/* Thwarts (Cross braces) */}
      {/* Center Thwart */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <boxGeometry args={[0.82, 0.02, 0.04]} />
        <meshStandardMaterial color="#4a2211" roughness={0.4} />
      </mesh>
      {/* Bow Quarter Thwart */}
      <mesh position={[0, 0.12, 1.0]} castShadow>
        <boxGeometry args={[0.72, 0.02, 0.04]} />
        <meshStandardMaterial color="#4a2211" roughness={0.4} />
      </mesh>
      {/* Stern Quarter Thwart */}
      <mesh position={[0, 0.12, -1.0]} castShadow>
        <boxGeometry args={[0.72, 0.02, 0.04]} />
        <meshStandardMaterial color="#4a2211" roughness={0.4} />
      </mesh>

      {/* Webbed Seats */}
      {/* Bow Seat */}
      <group position={[0, 0.05, 1.5]}>
        {/* Seat Frame */}
        <mesh castShadow>
          <boxGeometry args={[0.62, 0.02, 0.28]} />
          <meshStandardMaterial color="#4a2211" roughness={0.4} />
        </mesh>
        {/* Webbing center */}
        <mesh position={[0, 0.005, 0]}>
          <boxGeometry args={[0.5, 0.015, 0.2]} />
          <meshStandardMaterial color="#d8c3a5" roughness={0.8} />
        </mesh>
      </group>

      {/* Stern Seat */}
      <group position={[0, 0.05, -1.5]}>
        {/* Seat Frame */}
        <mesh castShadow>
          <boxGeometry args={[0.62, 0.02, 0.28]} />
          <meshStandardMaterial color="#4a2211" roughness={0.4} />
        </mesh>
        {/* Webbing center */}
        <mesh position={[0, 0.005, 0]}>
          <boxGeometry args={[0.5, 0.015, 0.2]} />
          <meshStandardMaterial color="#d8c3a5" roughness={0.8} />
        </mesh>
      </group>

      {/* Fisherman sitting on the stern seat */}
      <group position={[0, 0.08, -1.5]}>
        {/* Torso - Yellow raincoat */}
        <mesh position={[0, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.16, 0.45, 8]} />
          <meshStandardMaterial color="#fcd116" roughness={0.4} />
        </mesh>
        {/* Collar/Hood fold */}
        <mesh position={[0, 0.48, -0.04]} castShadow>
          <boxGeometry args={[0.26, 0.08, 0.16]} />
          <meshStandardMaterial color="#ebc015" roughness={0.4} />
        </mesh>
        {/* Hood (folded back on shoulders) */}
        <mesh position={[0, 0.42, -0.1]} rotation={[-0.4, 0, 0]} castShadow>
          <sphereGeometry args={[0.12, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#ebc015" roughness={0.4} />
        </mesh>
        
        {/* Head */}
        <mesh position={[0, 0.58, 0.02]} castShadow>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#ffd1b3" roughness={0.8} />
        </mesh>
        {/* Dark Goggles/Sunglasses */}
        <mesh position={[0, 0.6, 0.1]} castShadow>
          <boxGeometry args={[0.16, 0.03, 0.03]} />
          <meshStandardMaterial color="#111111" roughness={0.1} metalness={0.9} />
        </mesh>
        {/* Nose */}
        <mesh position={[0, 0.58, 0.11]} castShadow>
          <boxGeometry args={[0.025, 0.04, 0.03]} />
          <meshStandardMaterial color="#ffd1b3" roughness={0.8} />
        </mesh>
        {/* Beard (Brown) */}
        <mesh position={[0, 0.53, 0.07]} castShadow>
          <boxGeometry args={[0.12, 0.08, 0.08]} />
          <meshStandardMaterial color="#5c4033" roughness={0.9} />
        </mesh>
        
        {/* Beanie (Red) */}
        <mesh position={[0, 0.65, 0.01]} rotation={[-0.1, 0, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.11, 0.09, 8]} />
          <meshStandardMaterial color="#d9381e" roughness={0.7} />
        </mesh>
        {/* Beanie Pom-Pom */}
        <mesh position={[0, 0.7, 0.01]} castShadow>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color="#ffffff" roughness={0.7} />
        </mesh>

        {/* Legs in dark blue pants */}
        {/* Left Thigh */}
        <mesh position={[-0.14, 0.08, 0.18]} rotation={[0.4, 0, 0]} castShadow>
          <boxGeometry args={[0.09, 0.09, 0.32]} />
          <meshStandardMaterial color="#1a2536" roughness={0.6} />
        </mesh>
        {/* Right Thigh */}
        <mesh position={[0.14, 0.08, 0.18]} rotation={[0.4, 0, 0]} castShadow>
          <boxGeometry args={[0.09, 0.09, 0.32]} />
          <meshStandardMaterial color="#1a2536" roughness={0.6} />
        </mesh>
        {/* Left Calf */}
        <mesh position={[-0.14, -0.1, 0.34]} rotation={[-0.2, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 0.28, 0.08]} />
          <meshStandardMaterial color="#1a2536" roughness={0.6} />
        </mesh>
        {/* Right Calf */}
        <mesh position={[0.14, -0.1, 0.34]} rotation={[-0.2, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 0.28, 0.08]} />
          <meshStandardMaterial color="#1a2536" roughness={0.6} />
        </mesh>
        {/* Left Boot */}
        <mesh position={[-0.14, -0.23, 0.4]} castShadow>
          <boxGeometry args={[0.085, 0.07, 0.15]} />
          <meshStandardMaterial color="#3d2314" roughness={0.5} />
        </mesh>
        {/* Right Boot */}
        <mesh position={[0.14, -0.23, 0.4]} castShadow>
          <boxGeometry args={[0.085, 0.07, 0.15]} />
          <meshStandardMaterial color="#3d2314" roughness={0.5} />
        </mesh>

        {/* Arms holding the rod dynamically */}
        {/* Left Arm */}
        <mesh position={[-0.14, 0.28, 0.1]} rotation={[0.8, 0.8, -0.3]} castShadow>
          <cylinderGeometry args={[0.045, 0.04, 0.35, 6]} />
          <meshStandardMaterial color="#fcd116" roughness={0.4} />
        </mesh>
        {/* Left Hand */}
        <mesh position={[0.08, 0.2, 0.25]} castShadow>
          <sphereGeometry args={[0.035, 6, 6]} />
          <meshStandardMaterial color="#ffd1b3" roughness={0.8} />
        </mesh>

        {/* Right Arm (Holding rod near reel) */}
        <mesh position={[0.14, 0.28, 0.1]} rotation={[0.8, 0.1, 0.2]} castShadow>
          <cylinderGeometry args={[0.045, 0.04, 0.35, 6]} />
          <meshStandardMaterial color="#fcd116" roughness={0.4} />
        </mesh>
        {/* Right Hand */}
        <mesh position={[0.16, 0.22, 0.33]} castShadow>
          <sphereGeometry args={[0.035, 6, 6]} />
          <meshStandardMaterial color="#ffd1b3" roughness={0.8} />
        </mesh>
      </group>

      {/* Companion sitting on the bow seat, facing the fisherman */}
      <group position={[0, 0.08, 1.5]} rotation={[0, Math.PI, 0]}>
        {/* Torso - Blue winter coat */}
        <mesh position={[0, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.15, 0.44, 8]} />
          <meshStandardMaterial color="#2980b9" roughness={0.4} />
        </mesh>
        {/* Coat collar */}
        <mesh position={[0, 0.48, -0.04]} castShadow>
          <boxGeometry args={[0.24, 0.08, 0.15]} />
          <meshStandardMaterial color="#1f618d" roughness={0.4} />
        </mesh>
        {/* Coat hood (folded back) */}
        <mesh position={[0, 0.42, -0.1]} rotation={[-0.4, 0, 0]} castShadow>
          <sphereGeometry args={[0.11, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#1f618d" roughness={0.4} />
        </mesh>

        {/* Head */}
        <mesh position={[0, 0.58, 0.02]} castShadow>
          <sphereGeometry args={[0.095, 8, 8]} />
          <meshStandardMaterial color="#ffd1b3" roughness={0.8} />
        </mesh>
        {/* Nose */}
        <mesh position={[0, 0.58, 0.1]} castShadow>
          <boxGeometry args={[0.02, 0.035, 0.025]} />
          <meshStandardMaterial color="#ffd1b3" roughness={0.8} />
        </mesh>
        {/* Hair - Light brown/golden blonde, framing the face */}
        <group position={[0, 0.58, 0.01]}>
          {/* Back hair */}
          <mesh position={[0, -0.04, -0.07]} castShadow>
            <boxGeometry args={[0.18, 0.15, 0.06]} />
            <meshStandardMaterial color="#d4ac0d" roughness={0.9} />
          </mesh>
          {/* Left hair strand */}
          <mesh position={[-0.09, -0.06, 0.04]} rotation={[0.1, 0, 0.1]} castShadow>
            <boxGeometry args={[0.04, 0.16, 0.06]} />
            <meshStandardMaterial color="#d4ac0d" roughness={0.9} />
          </mesh>
          {/* Right hair strand */}
          <mesh position={[0.09, -0.06, 0.04]} rotation={[0.1, 0, -0.1]} castShadow>
            <boxGeometry args={[0.04, 0.16, 0.06]} />
            <meshStandardMaterial color="#d4ac0d" roughness={0.9} />
          </mesh>
        </group>

        {/* Knit Beanie (Cream / Off-white) */}
        <mesh position={[0, 0.65, 0.01]} rotation={[-0.1, 0, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.105, 0.08, 8]} />
          <meshStandardMaterial color="#f4f6f6" roughness={0.7} />
        </mesh>
        {/* Beanie Pom-Pom */}
        <mesh position={[0, 0.69, 0.01]} castShadow>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color="#eaecee" roughness={0.7} />
        </mesh>

        {/* Legs in dark grey pants */}
        {/* Left Thigh */}
        <mesh position={[-0.13, 0.08, 0.17]} rotation={[0.4, 0, 0]} castShadow>
          <boxGeometry args={[0.085, 0.085, 0.3]} />
          <meshStandardMaterial color="#34495e" roughness={0.6} />
        </mesh>
        {/* Right Thigh */}
        <mesh position={[0.13, 0.08, 0.17]} rotation={[0.4, 0, 0]} castShadow>
          <boxGeometry args={[0.085, 0.085, 0.3]} />
          <meshStandardMaterial color="#34495e" roughness={0.6} />
        </mesh>
        {/* Left Calf */}
        <mesh position={[-0.13, -0.1, 0.32]} rotation={[-0.2, 0, 0]} castShadow>
          <boxGeometry args={[0.075, 0.27, 0.075]} />
          <meshStandardMaterial color="#34495e" roughness={0.6} />
        </mesh>
        {/* Right Calf */}
        <mesh position={[0.13, -0.1, 0.32]} rotation={[-0.2, 0, 0]} castShadow>
          <boxGeometry args={[0.075, 0.27, 0.075]} />
          <meshStandardMaterial color="#34495e" roughness={0.6} />
        </mesh>
        {/* Left Boot */}
        <mesh position={[-0.13, -0.23, 0.38]} castShadow>
          <boxGeometry args={[0.08, 0.07, 0.14]} />
          <meshStandardMaterial color="#1c2833" roughness={0.5} />
        </mesh>
        {/* Right Boot */}
        <mesh position={[0.13, -0.23, 0.38]} castShadow>
          <boxGeometry args={[0.08, 0.07, 0.14]} />
          <meshStandardMaterial color="#1c2833" roughness={0.5} />
        </mesh>

        {/* Arms holding the rod dynamically */}
        {/* Left Arm (steadying lower rod) */}
        <mesh position={[-0.14, 0.26, 0.13]} rotation={[0.8, -0.8, 0.3]} castShadow>
          <cylinderGeometry args={[0.04, 0.035, 0.32, 6]} />
          <meshStandardMaterial color="#2980b9" roughness={0.4} />
        </mesh>
        {/* Left Hand */}
        <mesh position={[-0.08, 0.2, 0.25]} castShadow>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color="#ffd1b3" roughness={0.8} />
        </mesh>

        {/* Right Arm (holding rod) */}
        <mesh position={[0.14, 0.26, 0.13]} rotation={[0.8, -0.1, -0.2]} castShadow>
          <cylinderGeometry args={[0.04, 0.035, 0.32, 6]} />
          <meshStandardMaterial color="#2980b9" roughness={0.4} />
        </mesh>
        {/* Right Hand */}
        <mesh position={[0.14, 0.22, 0.28]} castShadow>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color="#ffd1b3" roughness={0.8} />
        </mesh>
      </group>

      {/* Fisherman's Fishing Rod (Static base orientation) */}
      <group position={[0.14, 0.22, -1.2]} rotation={[0.45, 0.15, 0.35]}>
        {/* Handle (Cork) */}
        <mesh castShadow position={[0, -0.7, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.3]} />
          <meshStandardMaterial color="#c2a679" roughness={0.8} />
        </mesh>
        {/* Reel (Golden metal) */}
        <mesh castShadow position={[0, -0.55, 0.03]} rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.04]} />
          <meshStandardMaterial color="#d4af37" roughness={0.1} metalness={0.9} />
        </mesh>
        {/* Rod Blank (Carbon Fiber) */}
        <mesh castShadow position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.006, 0.015, 2.1]} />
          <meshStandardMaterial color="#222222" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>

      {/* Companion's Hooked Fishing Rod (Reference hooked for rapid useFrame animations) */}
      <group ref={companionRodRef} position={[-0.12, 0.28, 1.22]} rotation={[0.45, -2.4, -0.3]}>
        {/* Handle (Cork) */}
        <mesh castShadow position={[0, -0.7, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.3]} />
          <meshStandardMaterial color="#c2a679" roughness={0.8} />
        </mesh>
        {/* Reel (Golden metal) */}
        <mesh castShadow position={[0, -0.55, 0.03]} rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.04]} />
          <meshStandardMaterial color="#d4af37" roughness={0.1} metalness={0.9} />
        </mesh>
        {/* Rod Blank (Carbon Fiber) */}
        <mesh castShadow position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.006, 0.015, 2.1]} />
          <meshStandardMaterial color="#222222" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>

      {/* Fisherman's Fishing Line (Stretched dynamically in useFrame) */}
      <mesh ref={fishermanLineRef} castShadow>
        <cylinderGeometry args={[0.0015, 0.0015, 1, 4]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
      </mesh>

      {/* Companion's Fishing Line (Stretched dynamically in useFrame, hooked) */}
      <mesh ref={companionLineRef} castShadow>
        <cylinderGeometry args={[0.002, 0.002, 1, 4]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
      </mesh>

      {/* Ripple/Splash where Fisherman's line enters water */}
      <mesh ref={fishermanRippleRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.02, 0.07, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Ripple/Splash where Companion's hooked line enters water (churning dynamically) */}
      <mesh ref={companionRippleRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.03, 0.1, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.75} side={THREE.DoubleSide} />
      </mesh>

      {/* Leaping low-poly fish appearing at the companion's splash point in a parabolic arc */}
      <group ref={leapingFishRef} visible={false}>
        {/* Fish body */}
        <mesh castShadow>
          <boxGeometry args={[0.05, 0.14, 0.03]} />
          <meshStandardMaterial color="#5dade2" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Fish Tail */}
        <mesh position={[0, -0.09, 0]} castShadow>
          <boxGeometry args={[0.07, 0.05, 0.015]} />
          <meshStandardMaterial color="#2e86c1" metalness={0.7} roughness={0.2} />
        </mesh>
        {/* Small fin */}
        <mesh position={[0, 0.02, 0.02]} rotation={[0.4, 0, 0]}>
          <boxGeometry args={[0.01, 0.04, 0.04]} />
          <meshStandardMaterial color="#3498db" />
        </mesh>
      </group>

      {/* Wooden Bucket with caught fish tail */}
      <group position={[-0.25, -0.08, -0.8]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.15, 0.12, 0.22, 10]} />
          <meshStandardMaterial color="#8b5a2b" roughness={0.6} flatShading />
        </mesh>
        {/* Metal bands around bucket */}
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.152, 0.152, 0.02, 10, 1, true]} />
          <meshStandardMaterial color="#7f8c8d" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.137, 0.137, 0.02, 10, 1, true]} />
          <meshStandardMaterial color="#7f8c8d" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Caught Fish tail sticking out */}
        <group position={[0.03, 0.08, 0.02]} rotation={[0.4, 0.5, 0.8]}>
          {/* Fish Body */}
          <mesh castShadow>
            <boxGeometry args={[0.05, 0.18, 0.03]} />
            <meshStandardMaterial color="#7fb3d5" metalness={0.7} roughness={0.2} />
          </mesh>
          {/* Fish Tail */}
          <mesh position={[0, 0.11, 0]} rotation={[0, 0, 0.2]}>
            <boxGeometry args={[0.07, 0.06, 0.015]} />
            <meshStandardMaterial color="#2980b9" metalness={0.7} roughness={0.2} />
          </mesh>
        </group>
      </group>

      {/* Tackle Box */}
      <group position={[0.25, -0.12, -0.8]} rotation={[0, 0.3, 0]}>
        {/* Main box */}
        <mesh castShadow>
          <boxGeometry args={[0.2, 0.14, 0.3]} />
          <meshStandardMaterial color="#4a7c59" roughness={0.3} metalness={0.5} />
        </mesh>
        {/* Metal latch */}
        <mesh position={[0, 0.02, 0.155]}>
          <boxGeometry args={[0.04, 0.05, 0.01]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Handle */}
        <mesh position={[0, 0.08, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.01, 0.01, 0.1]} />
          <meshStandardMaterial color="#222222" roughness={0.5} />
        </mesh>
      </group>

      {/* Elegant Wooden Paddle resting inside */}
      <group position={[-0.22, -0.22, 0.2]} rotation={[Math.PI / 2, 0, 0.05]}>
        {/* Shaft */}
        <mesh castShadow position={[0, 0, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 2.0]} />
          <meshStandardMaterial color="#b59469" roughness={0.3} />
        </mesh>
        {/* Blade */}
        <mesh castShadow position={[0, -1.1, 0]} scale={[1, 1, 0.25]}>
          <boxGeometry args={[0.12, 0.5, 0.05]} />
          <meshStandardMaterial color="#8b5a2b" roughness={0.2} />
        </mesh>
        {/* Grip (T-bar handle) */}
        <mesh castShadow position={[0, 1.0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.01, 0.01, 0.12]} />
          <meshStandardMaterial color="#8b5a2b" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
};
