import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Particle } from '../types';

interface GalaxySimulationProps {
  initialData: {
    particles: Particle[];
  };
}

const GalaxySimulation: React.FC<GalaxySimulationProps> = ({ initialData }) => {
  const points = useRef<THREE.Points>(null!);
  const particleCount = initialData?.particles.length || 50000;
  const sizes = useRef<Float32Array>(new Float32Array(particleCount));

  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const particleSizes = sizes.current;

    initialData.particles.forEach((particle, i) => {
      const i3 = i * 3;
      positions[i3] = particle.position[0];
      positions[i3 + 1] = particle.position[1];
      positions[i3 + 2] = particle.position[2];

      // Convert hex color to RGB
      const color = new THREE.Color(particle.color);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      particleSizes[i] = particle.type === 'star' ? 0.6 : 0.0001;
    });
    
    return { positions, colors, sizes: particleSizes };
  }, [initialData, particleCount]);

  useFrame((state) => {
    if (!points.current) return;

    const positions = points.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Calculate acceleration due to gravity towards center
      const x = positions[i3];
      const y = positions[i3 + 1];
      const z = positions[i3 + 2];
      
      const distanceFromCenter = Math.sqrt(x * x + y * y + z * z);
      const gravitationalForce = 0.00001 / Math.max(0.1, distanceFromCenter * distanceFromCenter);

      // Apply simple orbital motion
      const angle = Math.atan2(z, x);
      const newAngle = angle + (0.001 / Math.sqrt(distanceFromCenter));
      const radius = Math.sqrt(x * x + z * z);
      
      positions[i3] = Math.cos(newAngle) * radius;
      positions[i3 + 2] = Math.sin(newAngle) * radius;
      positions[i3 + 1] *= 0.999; // Slowly settle to the galactic plane
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
        <bufferAttribute
          attach="attributes-size"
          count={particleCount}
          array={particles.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        sizeAttenuation={true}
        vertexColors={true}
        transparent
        opacity={0.6}
        depthWrite={false}
      />
    </points>
  );
};

export default GalaxySimulation;