import * as THREE from 'three';
import { computeShader, particleVertexShader, particleFragmentShader } from '../shaders/galaxyShaders';
import type { Particle } from '../types';

export class GPUParticleSystem {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  
  private positionRenderTargets: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget];
  private currentPositionIndex: number = 0;
  private velocityRenderTargets: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget];
  private currentVelocityIndex: number = 0;
  private starPositionTexture: THREE.DataTexture;
  private colorTexture: THREE.DataTexture;
  
  private computeMaterial: THREE.ShaderMaterial;
  private quadGeometry: THREE.PlaneGeometry;
  private particleMaterial: THREE.ShaderMaterial;
  private particleGeometry: THREE.BufferGeometry;
  
  private textureSize: number;
  
  constructor(renderer: THREE.WebGLRenderer, particles: Particle[]) {
    this.renderer = renderer;
    this.textureSize = Math.ceil(Math.sqrt(particles.length));
    
    // Setup render targets with float textures
    const options = {
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter
    };
    
    this.positionRenderTargets = [
      new THREE.WebGLRenderTarget(this.textureSize, this.textureSize, options),
      new THREE.WebGLRenderTarget(this.textureSize, this.textureSize, options)
    ];
    this.velocityRenderTargets = [
      new THREE.WebGLRenderTarget(this.textureSize, this.textureSize, options),
      new THREE.WebGLRenderTarget(this.textureSize, this.textureSize, options)
    ];
    
    // Initialize compute scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quadGeometry = new THREE.PlaneGeometry(2, 2);
    
    // Initialize textures and particle system
    this.initializeTextures(particles);
    this.initializeParticleSystem(particles.length);
    
    // Create compute material with physics simulation
    this.computeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uDeltaTime: { value: 0 },
        uGravityStrength: { value: 0.5 },
        uOrbitalStrength: { value: 1.0 },
        uTextureSize: { value: new THREE.Vector2(this.textureSize, this.textureSize) },
        uPositionTexture: { value: null },
        uStarPositionTexture: { value: this.starPositionTexture },
        uVelocityTexture: { value: null }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: computeShader
    });
  }
  
  private initializeTextures(particles: Particle[]) {
    const size = this.textureSize * this.textureSize;
    const positionData = new Float32Array(size * 4);
    const colorData = new Float32Array(size * 4);
    const velocityData = new Float32Array(size * 4);
    
    particles.forEach((particle, i) => {
      const i4 = i * 4;
      // Position + mass/type flag (for stars: 1.0 + mass/1000, for particles: 0.0)
      positionData[i4] = particle.position[0];
      positionData[i4 + 1] = particle.position[1];
      positionData[i4 + 2] = particle.position[2];
      positionData[i4 + 3] = particle.type === 'star' ? 1.0 + (particle.mass / 1000) : 0.0;
      
      // Color
      const color = new THREE.Color(particle.color);
      colorData[i4] = color.r;
      colorData[i4 + 1] = color.g;
      colorData[i4 + 2] = color.b;
      colorData[i4 + 3] = 1.0;
      
      // Velocity (use provided velocity or default to 0)
      if (particle.velocity) {
        velocityData[i4] = particle.velocity[0];
        velocityData[i4 + 1] = particle.velocity[1];
        velocityData[i4 + 2] = particle.velocity[2];
      } else {
        velocityData[i4] = 0;
        velocityData[i4 + 1] = 0;
        velocityData[i4 + 2] = 0;
      }
      velocityData[i4 + 3] = 0;
    });
    
    // Create textures
    this.starPositionTexture = new THREE.DataTexture(
      positionData,
      this.textureSize,
      this.textureSize,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    this.starPositionTexture.needsUpdate = true;
    
    this.colorTexture = new THREE.DataTexture(
      colorData,
      this.textureSize,
      this.textureSize,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    this.colorTexture.needsUpdate = true;
    
    // Initialize render targets
    const initialPositionTexture = this.starPositionTexture.clone();
    const initialVelocityTexture = new THREE.DataTexture(
      velocityData,
      this.textureSize,
      this.textureSize,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    
    // Copy initial data to render targets
    this.renderer.setRenderTarget(this.positionRenderTargets[0]);
    this.renderer.render(new THREE.Mesh(
      this.quadGeometry,
      new THREE.MeshBasicMaterial({ map: initialPositionTexture })
    ), this.camera);
    
    this.renderer.setRenderTarget(this.velocityRenderTargets[0]);
    this.renderer.render(new THREE.Mesh(
      this.quadGeometry,
      new THREE.MeshBasicMaterial({ map: initialVelocityTexture })
    ), this.camera);
    
    // Copy to second velocity buffer
    this.renderer.setRenderTarget(this.velocityRenderTargets[1]);
    this.renderer.render(new THREE.Mesh(
      this.quadGeometry,
      new THREE.MeshBasicMaterial({ map: initialVelocityTexture })
    ), this.camera);
    
    this.renderer.setRenderTarget(null);
  }
  
  private initializeParticleSystem(particleCount: number) {
    const references = new Float32Array(particleCount * 2);
    for (let i = 0; i < particleCount; i++) {
      references[i * 2] = (i % this.textureSize) / this.textureSize;
      references[i * 2 + 1] = Math.floor(i / this.textureSize) / this.textureSize;
    }
    
    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute('reference', new THREE.BufferAttribute(references, 2));
    
    this.particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPositionTexture: { value: null },
        uColorTexture: { value: this.colorTexture }
      },
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }
  
  public update(deltaTime: number) {
    const currentTime = performance.now() / 1000;
    
    // Update compute shader uniforms
    this.computeMaterial.uniforms.uTime.value = currentTime;
    this.computeMaterial.uniforms.uDeltaTime.value = deltaTime;
    this.computeMaterial.uniforms.uPositionTexture.value = this.positionRenderTargets[this.currentPositionIndex].texture;
    this.computeMaterial.uniforms.uVelocityTexture.value = this.velocityRenderTargets[this.currentVelocityIndex].texture;
    
    // Compute new positions and velocities
    const computeMesh = new THREE.Mesh(this.quadGeometry, this.computeMaterial);
    
    // Update positions
    this.renderer.setRenderTarget(this.positionRenderTargets[1 - this.currentPositionIndex]);
    this.renderer.render(computeMesh, this.camera);
    
    // Update velocities
    this.renderer.setRenderTarget(this.velocityRenderTargets[1 - this.currentVelocityIndex]);
    this.renderer.render(computeMesh, this.camera);
    
    this.renderer.setRenderTarget(null);
    
    // Swap render targets
    this.currentPositionIndex = 1 - this.currentPositionIndex;
    this.currentVelocityIndex = 1 - this.currentVelocityIndex;
    
    // Update particle material
    this.particleMaterial.uniforms.uTime.value = currentTime;
    this.particleMaterial.uniforms.uPositionTexture.value = this.positionRenderTargets[this.currentPositionIndex].texture;
  }
  
  public getMesh(): THREE.Points {
    return new THREE.Points(this.particleGeometry, this.particleMaterial);
  }

  public setGravityStrength(value: number) {
    this.computeMaterial.uniforms.uGravityStrength.value = value;
  }

  public setOrbitalStrength(value: number) {
    this.computeMaterial.uniforms.uOrbitalStrength.value = value;
  }
  
  public dispose() {
    this.positionRenderTargets[0].dispose();
    this.positionRenderTargets[1].dispose();
    this.velocityRenderTargets[0].dispose();
    this.velocityRenderTargets[1].dispose();
    this.starPositionTexture.dispose();
    this.colorTexture.dispose();
    this.quadGeometry.dispose();
    this.particleGeometry.dispose();
    this.computeMaterial.dispose();
    this.particleMaterial.dispose();
  }
}