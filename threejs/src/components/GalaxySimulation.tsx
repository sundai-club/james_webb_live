import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const GalaxySimulation = () => {
  const points = useRef<THREE.Points>(null!);
  const particleCount = 50000;
  
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      // Calculate spiral galaxy position
      const radius = Math.random() * 10;
      const spinAngle = radius * 2;
      const branchAngle = (i % 3) * Math.PI * 2 / 3; // Changed to 3 arms for better distribution
      
      const randomOffset = 0.15; // Reduced random offset for tighter spiral
      const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * randomOffset;
      const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * randomOffset;
      const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * randomOffset;

      positions[i * 3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
      positions[i * 3 + 1] = randomY * (radius / 10); // Scale Y offset based on radius
      positions[i * 3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;
      
      // Color gradient from center to edge
      const mixedColor = new THREE.Color();
      const insideColor = new THREE.Color('#ff6030');
      const outsideColor = new THREE.Color('#1b3984');
      mixedColor.lerpColors(insideColor, outsideColor, radius / 10);
      
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }
    
    return {
      positions,
      colors
    };
  }, []);
  
  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y += 0.0005;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        sizeAttenuation={true}
        vertexColors
        transparent
        opacity={0.8}
      />
    </points>
  );
};

export default GalaxySimulation;