// Common vertex attributes and uniforms
export const commonUniforms = `
  uniform float uTime;
  uniform float uDeltaTime;
  uniform float uGravityStrength;
  uniform float uOrbitalStrength;
  uniform vec2 uTextureSize;
`;

// Position update compute shader
export const computeShader = `
  ${commonUniforms}
  
  uniform sampler2D uPositionTexture;
  uniform sampler2D uStarPositionTexture;
  uniform sampler2D uVelocityTexture;
  
  varying vec2 vUv;

  const float STAR_INFLUENCE_RADIUS = 5.0;
  const float MAX_STARS_PER_PARTICLE = 3.0;
  const float DAMPING = 0.99;
  const float G = 6.67430e-3; // Scaled gravitational constant
  
  struct ParticleData {
    vec3 position;
    vec3 velocity;
    float mass;
    bool isStar;
  };

  ParticleData loadParticle() {
    ParticleData p;
    vec4 posData = texture2D(uPositionTexture, vUv);
    vec4 velData = texture2D(uVelocityTexture, vUv);
    p.position = posData.xyz;
    p.velocity = velData.xyz;
    p.isStar = posData.w > 0.5;
    p.mass = p.isStar ? (posData.w - 1.0) * 1000.0 : 0.1;
    return p;
  }

  vec3 calculateGravitationalForce(vec3 pos1, float mass1, vec3 pos2, float mass2) {
    vec3 delta = pos2 - pos1;
    float r = length(delta);
    float r2 = r * r + 0.1; // Softening to prevent extreme forces
    return G * mass1 * mass2 * delta / (r2 * r);
  }

  vec3 calculateOrbitalVelocity(vec3 pos, vec3 centerPos, float centerMass) {
    vec3 toCenter = centerPos - pos;
    float r = length(toCenter);
    vec3 right = normalize(cross(toCenter, vec3(0.0, 1.0, 0.0)));
    float v = sqrt(G * centerMass / r);
    return right * v;
  }
  
  void main() {
    ParticleData particle = loadParticle();
    
    if (!particle.isStar) {
      vec3 totalForce = vec3(0.0);
      vec3 totalOrbitalVel = vec3(0.0);
      float totalInfluence = 0.0;
      
      // Grid-based neighbor search
      vec2 gridPos = floor(particle.position.xz / STAR_INFLUENCE_RADIUS);
      
      for(float dy = -1.0; dy <= 1.0; dy++) {
        for(float dx = -1.0; dx <= 1.0; dx++) {
          vec2 searchPos = gridPos + vec2(dx, dy);
          vec2 searchUv = (searchPos + 0.5) / uTextureSize;
          
          vec4 starPosData = texture2D(uStarPositionTexture, searchUv);
          if(starPosData.w > 0.5) { // Is a star
            vec3 starPos = starPosData.xyz;
            float starMass = (starPosData.w - 1.0) * 1000.0;
            
            vec3 toStar = starPos - particle.position;
            float dist = length(toStar);
            
            if(dist < STAR_INFLUENCE_RADIUS) {
              float influence = 1.0 - (dist / STAR_INFLUENCE_RADIUS);
              influence = influence * influence; // Quadratic falloff
              
              totalForce += calculateGravitationalForce(
                particle.position, particle.mass,
                starPos, starMass
              ) * influence;
              
              totalOrbitalVel += calculateOrbitalVelocity(
                particle.position, starPos, starMass
              ) * influence;
              
              totalInfluence += influence;
            }
          }
          
          if(totalInfluence >= MAX_STARS_PER_PARTICLE) break;
        }
        if(totalInfluence >= MAX_STARS_PER_PARTICLE) break;
      }
      
      // Update velocity and position
      if(totalInfluence > 0.0) {
        totalForce /= totalInfluence;
        totalOrbitalVel /= totalInfluence;
        
        // Blend current velocity with ideal orbital velocity
        vec3 newVel = mix(
          particle.velocity,
          totalOrbitalVel,
          uOrbitalStrength * uDeltaTime
        );
        
        // Add gravitational forces
        newVel += (totalForce / particle.mass) * uGravityStrength * uDeltaTime;
        
        // Apply damping
        particle.velocity = newVel * DAMPING;
      }
      
      // Update position
      particle.position += particle.velocity * uDeltaTime;
      
      // Boundary check
      float maxRadius = 20.0;
      float dist = length(particle.position);
      if(dist > maxRadius) {
        particle.position = normalize(particle.position) * maxRadius;
        particle.velocity *= 0.5;
      }
      
      // Output position and velocity
      gl_FragColor = vec4(particle.position, 0.0);
    } else {
      // Star movement
      float angle = atan(particle.position.z, particle.position.x);
      float radius = length(particle.position.xz);
      float orbitalSpeed = 0.05 / sqrt(max(0.1, radius));
      
      angle += orbitalSpeed * uDeltaTime;
      vec3 newPos = particle.position;
      newPos.x = cos(angle) * radius;
      newPos.z = sin(angle) * radius;
      newPos.y *= 0.998; // Settle to galactic plane
      
      gl_FragColor = vec4(newPos, particle.mass / 1000.0 + 1.0);
    }
  }
`;

// Vertex shader for rendering particles
export const particleVertexShader = `
  ${commonUniforms}
  
  attribute vec2 reference;
  uniform sampler2D uPositionTexture;
  uniform sampler2D uColorTexture;
  
  varying vec3 vColor;
  varying float vType;
  varying float vDistance;
  
  void main() {
    vec4 positionData = texture2D(uPositionTexture, reference);
    vec4 colorData = texture2D(uColorTexture, reference);
    
    vColor = colorData.rgb;
    vType = 1.0 - positionData.w;
    
    vec4 mvPosition = modelViewMatrix * vec4(positionData.xyz, 1.0);
    vDistance = -mvPosition.z;
    
    float baseSize = vType > 0.5 ? 2.0 : 30.0;
    float sizeScale = 300.0 / vDistance;
    gl_PointSize = baseSize * sizeScale;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Fragment shader for rendering particles
export const particleFragmentShader = `
  varying vec3 vColor;
  varying float vType;
  varying float vDistance;
  
  void main() {
    vec2 center = gl_PointCoord * 2.0 - 1.0;
    float dist = length(center);
    
    if(vType > 0.5) {
      // Regular particle with soft, distance-based fade
      float strength = 1.0 - smoothstep(0.0, 0.8, dist);
      float distanceFade = clamp(2000.0 / vDistance, 0.0, 1.0);
      
      // Add some energy variation based on distance from center
      float energy = mix(0.4, 1.0, strength);
      vec3 finalColor = vColor * energy;
      
      gl_FragColor = vec4(finalColor, strength * 0.8 * distanceFade);
    } else {
      // Star with intense core and subtle glow
      float coreBrightness = 1.0 - smoothstep(0.0, 0.4, dist);
      float glowStrength = exp(-1.5 * dist);
      
      // Add chromatic aberration to the glow
      vec3 glowColor = mix(vColor, vec3(1.0), 0.5);
      vec3 finalColor = mix(glowColor, vec3(1.0), coreBrightness);
      
      // Add distance-based intensity
      float glowFade = clamp(3000.0 / vDistance, 0.0, 1.0);
      float alpha = (coreBrightness + glowStrength * 0.6) * glowFade;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  }
`;