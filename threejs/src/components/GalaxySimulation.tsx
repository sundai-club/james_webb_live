import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Star {
  position: number[];
  velocity: number[];
  mass: number;
  type: 'star';
}

interface Particle {
  position: number[];
  velocity: number[];
  color: number[];
  mass: number;
  type: 'particle';
}

interface GalaxyData {
  stars: Star[];
  particles: Particle[];
}

const GalaxySimulation = () => {
  const starsRef = useRef<THREE.Points>(null!);
  const particlesRef = useRef<THREE.Points>(null!);
  const [galaxyData, setGalaxyData] = useState<GalaxyData | null>(null);
  
  const starVelocities = useRef<Float32Array>();
  const particleVelocities = useRef<Float32Array>();
  const mousePosition = useRef(new THREE.Vector3());
  const mouseForce = useRef(0);
  
  // Handle mouse interaction
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Convert mouse coordinates to 3D space
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      mousePosition.current.set(x * 10, y * 10, 0);
    };

    const handleMouseDown = () => {
      mouseForce.current = 1;
    };

    const handleMouseUp = () => {
      mouseForce.current = 0;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    fetch('/initial_galaxy.json')
      .then(res => res.json())
      .then(data => {
        setGalaxyData(data);
        starVelocities.current = new Float32Array(data.stars.length * 3);
        particleVelocities.current = new Float32Array(data.particles.length * 3);
        
        data.stars.forEach((star, i) => {
          const i3 = i * 3;
          starVelocities.current![i3] = star.velocity[0];
          starVelocities.current![i3 + 1] = star.velocity[1];
          starVelocities.current![i3 + 2] = star.velocity[2];
        });
        
        data.particles.forEach((particle, i) => {
          const i3 = i * 3;
          particleVelocities.current![i3] = particle.velocity[0];
          particleVelocities.current![i3 + 1] = particle.velocity[1];
          particleVelocities.current![i3 + 2] = particle.velocity[2];
        });
      });
  }, []);

  const { starPositions, starColors, particlePositions, particleColors, starMasses } = useMemo(() => {
    if (!galaxyData) return {
      starPositions: new Float32Array(),
      starColors: new Float32Array(),
      particlePositions: new Float32Array(),
      particleColors: new Float32Array(),
      starMasses: new Float32Array()
    };

    const starPositions = new Float32Array(galaxyData.stars.length * 3);
    const starColors = new Float32Array(galaxyData.stars.length * 3);
    const starMasses = new Float32Array(galaxyData.stars.length);
    const particlePositions = new Float32Array(galaxyData.particles.length * 3);
    const particleColors = new Float32Array(galaxyData.particles.length * 3);

    galaxyData.stars.forEach((star, i) => {
      const i3 = i * 3;
      starPositions[i3] = star.position[0];
      starPositions[i3 + 1] = star.position[1];
      starPositions[i3 + 2] = star.position[2];
      
      // Brighter stars
      starColors[i3] = 1.0;     // R
      starColors[i3 + 1] = 0.95; // G
      starColors[i3 + 2] = 0.8;  // B
      
      starMasses[i] = star.mass;
    });

    galaxyData.particles.forEach((particle, i) => {
      const i3 = i * 3;
      particlePositions[i3] = particle.position[0];
      particlePositions[i3 + 1] = particle.position[1];
      particlePositions[i3 + 2] = particle.position[2];
      
      particleColors[i3] = particle.color[0];
      particleColors[i3 + 1] = particle.color[1];
      particleColors[i3 + 2] = particle.color[2];
    });

    return {
      starPositions,
      starColors,
      particlePositions,
      particleColors,
      starMasses
    };
  }, [galaxyData]);
  
  useFrame((state, delta) => {
    if (!galaxyData || !starsRef.current || !particlesRef.current) return;

    const starPos = starsRef.current.geometry.attributes.position.array as Float32Array;
    const particlePos = particlesRef.current.geometry.attributes.position.array as Float32Array;
    
    // Limit delta to prevent instability
    const cappedDelta = Math.min(delta, 0.1);
    
    // Update stars with orbital motion
    for (let i = 0; i < galaxyData.stars.length; i++) {
      const i3 = i * 3;
      
      // Update position based on velocity
      starPos[i3] += starVelocities.current![i3] * cappedDelta;
      starPos[i3 + 1] += starVelocities.current![i3 + 1] * cappedDelta;
      starPos[i3 + 2] += starVelocities.current![i3 + 2] * cappedDelta;
    }
    
    // Update particles
    for (let i = 0; i < galaxyData.particles.length; i++) {
      const i3 = i * 3;
      
      // Update position based on velocity
      particlePos[i3] += particleVelocities.current![i3] * cappedDelta;
      particlePos[i3 + 1] += particleVelocities.current![i3 + 1] * cappedDelta;
      particlePos[i3 + 2] += particleVelocities.current![i3 + 2] * cappedDelta;
      
      let totalForceX = 0;
      let totalForceY = 0;
      let totalForceZ = 0;
      
      // Star gravity (only consider closest stars for performance)
      for (let j = 0; j < Math.min(5, galaxyData.stars.length); j++) {
        const j3 = j * 3;
        
        const dx = starPos[j3] - particlePos[i3];
        const dy = starPos[j3 + 1] - particlePos[i3 + 1];
        const dz = starPos[j3 + 2] - particlePos[i3 + 2];
        
        const distanceSquared = dx * dx + dy * dy + dz * dz;
        const distance = Math.sqrt(distanceSquared);
        
        // Stronger gravity with smoother falloff
        const force = (j === 0) 
          ? (0.000004 * starMasses[j]) / (distanceSquared + 0.1) // Stronger central attraction
          : (0.000001 * starMasses[j]) / (distanceSquared + 1);  // Normal stars
        
        totalForceX += (dx / distance) * force;
        totalForceY += (dy / distance) * force;
        totalForceZ += (dz / distance) * force;
      }

      // Mouse interaction
      if (mouseForce.current !== 0) {
        const dx = mousePosition.current.x - particlePos[i3];
        const dy = mousePosition.current.y - particlePos[i3 + 1];
        const dz = mousePosition.current.z - particlePos[i3 + 2];
        
        const distanceSquared = dx * dx + dy * dy + dz * dz;
        const distance = Math.sqrt(distanceSquared);
        
        const mouseStrength = 0.0001;
        const force = (mouseStrength * mouseForce.current) / (distanceSquared + 0.1);
        
        totalForceX += (dx / distance) * force;
        totalForceY += (dy / distance) * force;
        totalForceZ += (dz / distance) * force;
      }
      
      // Apply forces with gentler effect
      particleVelocities.current![i3] += totalForceX * cappedDelta;
      particleVelocities.current![i3 + 1] += totalForceY * cappedDelta;
      particleVelocities.current![i3 + 2] += totalForceZ * cappedDelta;
      
      // Gentler damping
      const damping = 0.9999;
      particleVelocities.current![i3] *= damping;
      particleVelocities.current![i3 + 1] *= damping;
      particleVelocities.current![i3 + 2] *= damping;
    }
    
    starsRef.current.geometry.attributes.position.needsUpdate = true;
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!galaxyData) return null;

  return (
    <>
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={galaxyData.stars.length}
            array={starPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={galaxyData.stars.length}
            array={starColors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.25}
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
            count={galaxyData.particles.length}
            array={particlePositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={galaxyData.particles.length}
            array={particleColors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.02}
          sizeAttenuation={true}
          vertexColors
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
};

export default GalaxySimulation;