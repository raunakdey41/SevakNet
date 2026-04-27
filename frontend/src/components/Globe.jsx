import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Icosahedron } from '@react-three/drei';

function RotatingGlobe() {
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
      meshRef.current.rotation.x += 0.0015;
    }
  });

  return (
    <Icosahedron ref={meshRef} args={[1, 3]}>
      <meshBasicMaterial color="#1D9E75" wireframe transparent opacity={0.6} />
    </Icosahedron>
  );
}

export default function Globe() {
  return (
    <div style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, 0, 2.2] }}>
        <RotatingGlobe />
      </Canvas>
    </div>
  );
}
