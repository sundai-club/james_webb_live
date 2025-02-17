export type Vector3 = [number, number, number];

export interface Particle {
  position: Vector3;
  velocity?: Vector3;
  color: string; // hex color
  mass: number;
  type: 'star' | 'particle';
}