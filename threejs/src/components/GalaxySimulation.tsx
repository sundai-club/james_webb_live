import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Particle } from '../types';

interface GalaxySimulationProps {
  initialData?: {
    particles: Particle[];
  };
}

const GalaxySimulation: React.FC<GalaxySimulationProps> = ({ initialData }) => {
  const points = useRef<THREE.Points>(null!);
  const particleCount = initialData?.particles.length || 50000;
  const velocities = useRef<Float32Array>(new Float32Array(particleCount * 3));
  const sizes = useRef<Float32Array>(new Float32Array(particleCount));
  
  const exportGalaxyData = () => {
    if (!points.current) return;
    
    const positions = points.current.geometry.attributes.position.array as Float32Array;
    const colors = points.current.geometry.attributes.color.array as Float32Array;
    const vels = velocities.current;
    
    const galaxyData = {
      particles: Array(particleCount).fill(0).map((_, i) => {
        const i3 = i * 3;
        const distanceFromCenter = Math.sqrt(
          positions[i3] * positions[i3] + 
          positions[i3 + 1] * positions[i3 + 1] + 
          positions[i3 + 2] * positions[i3 + 2]
        );
        
        const particle: Particle = {
          position: [positions[i3], positions[i3 + 1], positions[i3 + 2]],
          velocity: [vels[i3], vels[i3 + 1], vels[i3 + 2]],
          color: [colors[i3], colors[i3 + 1], colors[i3 + 2]],
          mass: 1 / (distanceFromCenter + 0.1),
          type: distanceFromCenter < 2 ? 'star' : 'particle'
        };
        return particle;
      })
    };

    const jsonContent = JSON.stringify(galaxyData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'galaxy_state.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    window.addEventListener('export-galaxy-data', exportGalaxyData);
    return () => window.removeEventListener('export-galaxy-data', exportGalaxyData);
  }, []);

  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const particleSizes = sizes.current;
    const vels = velocities.current;

    if (initialData) {
      initialData.particles.forEach((particle, i) => {
        const i3 = i * 3;
        positions[i3] = particle.position[0];
        positions[i3 + 1] = particle.position[1];
        positions[i3 + 2] = particle.position[2];

        vels[i3] = particle.velocity[0];
        vels[i3 + 1] = particle.velocity[1];
        vels[i3 + 2] = particle.velocity[2];

        colors[i3] = particle.color[0];
        colors[i3 + 1] = particle.color[1];
        colors[i3 + 2] = particle.color[2];

        particleSizes[i] = particle.type === 'star' ? 0.6 : 0.0001;
      });
    }
    
    return { positions, colors, sizes: particleSizes };
  }, [initialData, particleCount]);

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