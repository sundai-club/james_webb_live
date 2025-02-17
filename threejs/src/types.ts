export type Vector3 = [number, number, number];

export interface Particle {
  position: [number, number, number];
  velocity: [number, number, number];
  color: [number, number, number];
  mass: number;
  type: 'star' | 'particle';
}