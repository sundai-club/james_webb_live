import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { Particle } from '../types';

interface GalaxySimulationProps {
  initialData?: {
    particles: Particle[];
  };
}

// Add custom star shader
const starVertexShader = `
  attribute float size;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragmentShader = `
  varying vec3 vColor;
  void main() {
    vec2 center = gl_PointCoord * 2.0 - 1.0;
    float dist = length(center);
    
    // Create soft sphere effect
    float strength = 1.0 - smoothstep(0.0, 1.0, dist);
    
    // Add glow effect
    float glow = exp(-2.0 * dist);
    
    // Combine core and glow
    vec3 color = vColor;
    float alpha = strength * 0.8 + glow * 0.4;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

const GalaxySimulation: React.FC<GalaxySimulationProps> = ({ initialData }) => {
  const starsRef = useRef<THREE.Points>(null!);
  const particlesRef = useRef<THREE.Points>(null!);
  const orbitControlsRef = useRef<any>(null);

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

  const { starPositions, starColors, starSizes } = useMemo(() => {
    const positions = new Float32Array(stars.length * 3);
    const colors = new Float32Array(stars.length * 3);
    const sizes = new Float32Array(stars.length);

    stars.forEach((star, i) => {
      const i3 = i * 3;
      positions[i3] = star.position[0];
      positions[i3 + 1] = star.position[1];
      positions[i3 + 2] = star.position[2];

      const color = new THREE.Color(star.color);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      // Vary star sizes based on mass
      sizes[i] = star.mass ? Math.min(2.0, Math.max(0.5, star.mass / 200)) : 1.0;
    });

    return { starPositions: positions, starColors: colors, starSizes: sizes };
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

  // Create custom star material
  const starMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        scale: { value: 1 }
      },
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      vertexColors: true
    });
  }, []);

  useFrame((state) => {
    if (!orbitControlsRef.current) return;
    
    // Add a gentle automatic rotation
    orbitControlsRef.current.autoRotateSpeed = 0.5;
    orbitControlsRef.current.autoRotate = true;
  });

  return (
    <>
      <OrbitControls 
        ref={orbitControlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={100}
      />
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
          <bufferAttribute
            attach="attributes-size"
            count={stars.length}
            array={starSizes}
            itemSize={1}
          />
        </bufferGeometry>
        <primitive object={starMaterial} attach="material" />
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
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </>
  );
};

export default GalaxySimulation;