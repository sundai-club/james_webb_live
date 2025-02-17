// When creating particles:
particles.push({
  position: [Number(x.toFixed(3)), Number(y.toFixed(3)), Number(z.toFixed(3))],
  velocity: [
    Number((-Math.sin(spiralAngle) * orbitSpeed).toFixed(6)),
    0,
    Number((Math.cos(spiralAngle) * orbitSpeed).toFixed(6))
  ],
  color: [/* ... */],
  mass: 0.0001,
  type: 'particle'
}); 