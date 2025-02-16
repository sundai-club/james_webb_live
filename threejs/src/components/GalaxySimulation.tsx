import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const GalaxySimulation = () => {
  const points = useRef<THREE.Points>(null!);
  const particleCount = 50000;
  
  // Store velocities for each particle
  const velocities = useRef<Float32Array>(new Float32Array(particleCount * 3));
  
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const vels = velocities.current;
    
    for (let i = 0; i < particleCount; i++) {
      // Calculate spiral galaxy position
      const radius = Math.random() * 10;
      const spinAngle = radius * 2;
      const branchAngle = (i % 3) * Math.PI * 2 / 3;
      
      const randomOffset = 0.15;
      const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * randomOffset;
      const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * randomOffset;
      const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * randomOffset;

      const x = Math.cos(branchAngle + spinAngle) * radius + randomX;
      const y = randomY * (radius / 10);
      const z = Math.sin(branchAngle + spinAngle) * radius + randomZ;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Calculate orbital velocity (faster near center, slower at edges)
      // Using simplified Keplerian orbital mechanics
      const distanceFromCenter = Math.sqrt(x * x + z * z);
      const orbitalSpeed = 1 / Math.sqrt(Math.max(0.1, distanceFromCenter)); // Prevent division by zero
      
      // Tangential velocity components
      const angle = Math.atan2(z, x);
      vels[i * 3] = -Math.sin(angle) * orbitalSpeed * 0.002;     // x velocity
      vels[i * 3 + 1] = (Math.random() - 0.5) * 0.0001;         // y velocity (slight vertical movement)
      vels[i * 3 + 2] = Math.cos(angle) * orbitalSpeed * 0.002;  // z velocity
      
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
    if (!points.current) return;

    const positions = points.current.geometry.attributes.position.array as Float32Array;
    const vels = velocities.current;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Update positions based on velocity
      positions[i3] += vels[i3];
      positions[i3 + 1] += vels[i3 + 1];
      positions[i3 + 2] += vels[i3 + 2];

      // Calculate acceleration due to gravity towards center
      const x = positions[i3];
      const y = positions[i3 + 1];
      const z = positions[i3 + 2];
      
      const distanceFromCenter = Math.sqrt(x * x + y * y + z * z);
      const gravitationalForce = 0.00001 / Math.max(0.1, distanceFromCenter * distanceFromCenter);

      // Apply acceleration
      vels[i3] -= (x / distanceFromCenter) * gravitationalForce;
      vels[i3 + 1] -= (y / distanceFromCenter) * gravitationalForce;
      vels[i3 + 2] -= (z / distanceFromCenter) * gravitationalForce;
    }

    points.current.geometry.attributes.position.needsUpdate = true;
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