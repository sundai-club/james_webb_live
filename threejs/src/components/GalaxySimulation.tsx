import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Particle } from '../types';

interface GalaxySimulationProps {
  initialData?: {
    particles: Particle[];
  };
}

const GalaxySimulation: React.FC<GalaxySimulationProps> = ({ initialData }) => {
  const starsRef = useRef<THREE.Points>(null!);
  const particlesRef = useRef<THREE.Points>(null!);

  const { stars, particles } = useMemo(() => {
    if (!initialData) {
      return { stars: [], particles: [] };
    }

    const stars: Particle[] = [];
    const particles: Particle[] = [];

    // Split particles and stars
    initialData.particles.forEach(particle => {
      if (particle.type === 'star') {
        stars.push(particle);
      } else {
        particles.push(particle);
      }
    });

    return { stars, particles };
  }, [initialData]);

  const { starPositions, starColors } = useMemo(() => {
    const positions = new Float32Array(stars.length * 3);
    const colors = new Float32Array(stars.length * 3);

    stars.forEach((star, i) => {
      const i3 = i * 3;
      positions[i3] = star.position[0];
      positions[i3 + 1] = star.position[1];
      positions[i3 + 2] = star.position[2];

      const color = new THREE.Color(star.color);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    });

    return { starPositions: positions, starColors: colors };
  }, [stars]);

  const { particlePositions, particleColors } = useMemo(() => {
    const positions = new Float32Array(particles.length * 3);
    const colors = new Float32Array(particles.length * 3);

    particles.forEach((particle, i) => {
      const i3 = i * 3;
      positions[i3] = particle.position[0];
      positions[i3 + 1] = particle.position[1];
      positions[i3 + 2] = particle.position[2];

      const color = new THREE.Color(particle.color);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    });

    return { particlePositions: positions, particleColors: colors };
  }, [particles]);

  useFrame((state) => {
    if (!particlesRef.current || !starsRef.current) return;

    const starPositions = starsRef.current.geometry.attributes.position.array as Float32Array;
    const particlePositions = particlesRef.current.geometry.attributes.position.array as Float32Array;

    // Move stars slowly around galactic center
    for (let s = 0; s < stars.length; s++) {
      const s3 = s * 3;
      const x = starPositions[s3];
      const z = starPositions[s3 + 2];
      
      const distanceFromCenter = Math.sqrt(x * x + z * z);
      const angle = Math.atan2(z, x);
      
      // Slower orbital speed for stars
      const orbitalSpeed = 0.0005 / Math.sqrt(Math.max(0.1, distanceFromCenter));
      const newAngle = angle + orbitalSpeed;
      
      starPositions[s3] = Math.cos(newAngle) * distanceFromCenter;
      starPositions[s3 + 2] = Math.sin(newAngle) * distanceFromCenter;
    }

    // Move particles around nearest star
    for (let i = 0; i < particles.length; i++) {
      const i3 = i * 3;
      
      // Find nearest star
      let nearestStarDist = Infinity;
      let nearestStarPos = { x: 0, y: 0, z: 0 };
      
      for (let s = 0; s < stars.length; s++) {
        const s3 = s * 3;
        const dx = particlePositions[i3] - starPositions[s3];
        const dy = particlePositions[i3 + 1] - starPositions[s3 + 1];
        const dz = particlePositions[i3 + 2] - starPositions[s3 + 2];
        const dist = dx * dx + dy * dy + dz * dz;
        
        if (dist < nearestStarDist) {
          nearestStarDist = dist;
          nearestStarPos = { 
            x: starPositions[s3], 
            y: starPositions[s3 + 1], 
            z: starPositions[s3 + 2] 
          };
        }
      }

      // Calculate orbital motion around nearest star
      const dx = particlePositions[i3] - nearestStarPos.x;
      const dy = particlePositions[i3 + 1] - nearestStarPos.y;
      const dz = particlePositions[i3 + 2] - nearestStarPos.z;
      
      const distanceFromStar = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const angle = Math.atan2(dz, dx);
      
      // Orbital speed based on distance from star (Kepler's laws)
      const orbitalSpeed = 0.002 / Math.sqrt(Math.max(0.1, distanceFromStar));
      const newAngle = angle + orbitalSpeed;
      
      // Update position relative to star
      particlePositions[i3] = nearestStarPos.x + Math.cos(newAngle) * distanceFromStar;
      particlePositions[i3 + 2] = nearestStarPos.z + Math.sin(newAngle) * distanceFromStar;
      
      // Slowly settle to star's plane
      const targetY = nearestStarPos.y;
      particlePositions[i3 + 1] += (targetY - particlePositions[i3 + 1]) * 0.001;
    }

    starsRef.current.geometry.attributes.position.needsUpdate = true;
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <>
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={stars.length}
            array={starPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={stars.length}
            array={starColors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.8}
          sizeAttenuation={true}
          vertexColors
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particles.length}
            array={particlePositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={particles.length}
            array={particleColors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.015}
          sizeAttenuation={true}
          vertexColors
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </>
  );
};

export default GalaxySimulation;