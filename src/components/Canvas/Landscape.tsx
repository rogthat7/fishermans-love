import * as THREE from 'three';
import { useMemo } from 'react';

export const Landscape = () => {
  // Generate coordinates and parameters for hills and palm trees
  const landscapeElements = useMemo(() => {
    // Distant soft hills (placed around the horizon to create a cove/bay feel)
    const hills = [
      // Far background backdrop
      { pos: [0, -3.5, -45], scale: [32, 10, 15], color: '#13301a' },
      
      // Mid background left shoreline
      { pos: [-18, -1.8, -25], scale: [14, 5.5, 9], color: '#1d4826' },
      { pos: [-24, -1.2, -15], scale: [15, 6, 11], color: '#25542f' },
      { pos: [-12, -2.5, -30], scale: [11, 4.5, 7], color: '#193f20' },
      
      // Mid background right shoreline
      { pos: [18, -1.8, -25], scale: [14, 5.5, 9], color: '#1c4524' },
      { pos: [24, -1.2, -15], scale: [15, 6, 11], color: '#23502d' },
      { pos: [12, -2.5, -30], scale: [11, 4.5, 7], color: '#1a3e21' },
      
      // Distant sides
      { pos: [-35, -0.5, -5], scale: [18, 7, 12], color: '#1e4826' },
      { pos: [35, -0.5, -5], scale: [18, 7, 12], color: '#224e2c' },
    ];

    // Palm trees positioned along the water edges on/near the hills
    const trees = [
      // Left Shoreline trees
      { pos: [-11, 0.35, -16], scale: 1.0, rotY: 0.2, bend: 0.16 },
      { pos: [-13, 0.7, -18], scale: 1.2, rotY: 1.3, bend: 0.22 },
      { pos: [-9, 0.1, -21], scale: 0.85, rotY: 0.7, bend: 0.12 },
      { pos: [-15, 1.1, -22], scale: 1.3, rotY: 2.1, bend: 0.26 },
      
      // Right Shoreline trees
      { pos: [11, 0.35, -16], scale: 1.0, rotY: -0.4, bend: -0.16 },
      { pos: [13, 0.7, -18], scale: 1.15, rotY: 0.6, bend: -0.21 },
      { pos: [9, 0.1, -21], scale: 0.85, rotY: -0.8, bend: -0.11 },
      { pos: [15, 1.1, -22], scale: 1.35, rotY: 1.7, bend: -0.24 },

      // Nearer points (frame the camera view nicely)
      { pos: [-8.5, -0.1, -11], scale: 0.75, rotY: 0.5, bend: 0.1 },
      { pos: [8.5, -0.1, -11], scale: 0.75, rotY: -0.5, bend: -0.1 },
      
      // Distant tree groups
      { pos: [-6, -0.1, -26], scale: 0.65, rotY: 0.3, bend: 0.08 },
      { pos: [6, -0.1, -26], scale: 0.65, rotY: -0.3, bend: -0.08 },
    ];

    return { hills, trees };
  }, []);

  return (
    <group>
      {/* Hills */}
      {landscapeElements.hills.map((hill, idx) => (
        <mesh key={`hill-${idx}`} position={hill.pos as any} scale={hill.scale as any} castShadow receiveShadow>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial 
            color={hill.color} 
            roughness={0.9} 
            metalness={0.05} 
            flatShading 
          />
        </mesh>
      ))}

      {/* Palm Trees */}
      {landscapeElements.trees.map((tree, idx) => (
        <group key={`tree-${idx}`} position={tree.pos as any} scale={[tree.scale, tree.scale, tree.scale]}>
          <group rotation={[0, tree.rotY, tree.bend]}>
            
            {/* Curved Trunk */}
            <mesh castShadow>
              <cylinderGeometry args={[0.08, 0.13, 1.9, 6]} />
              <meshStandardMaterial color="#553a2b" roughness={0.9} flatShading />
            </mesh>
            
            {/* Ring details on the palm trunk */}
            {[0.3, -0.3, 0.6, -0.6].map((offset, ringIdx) => (
              <mesh key={ringIdx} position={[0, offset, 0]} rotation={[0.05, 0, 0]}>
                <cylinderGeometry args={[0.11, 0.11, 0.03, 6]} />
                <meshStandardMaterial color="#442e22" roughness={0.95} />
              </mesh>
            ))}

            {/* Palm Fronds (Curving leaves) */}
            <group position={[0, 0.95, 0]}>
              {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                const angle = (i * Math.PI * 2) / 7;
                return (
                  <group key={i} rotation={[0.45, angle, 0.15]}>
                    {/* Inner leaf segment */}
                    <mesh position={[0, 0, 0.35]} rotation={[0.15, 0, 0]} castShadow>
                      <boxGeometry args={[0.12, 0.015, 0.7]} />
                      <meshStandardMaterial 
                        color="#196f3d" 
                        roughness={0.7} 
                        side={THREE.DoubleSide} 
                        flatShading 
                      />
                    </mesh>
                    {/* Drooping tip segment */}
                    <mesh position={[0, -0.06, 0.8]} rotation={[0.35, 0, 0]} castShadow>
                      <boxGeometry args={[0.09, 0.01, 0.4]} />
                      <meshStandardMaterial 
                        color="#1e8449" 
                        roughness={0.7} 
                        side={THREE.DoubleSide} 
                        flatShading 
                      />
                    </mesh>
                  </group>
                );
              })}
            </group>

          </group>
        </group>
      ))}
    </group>
  );
};
