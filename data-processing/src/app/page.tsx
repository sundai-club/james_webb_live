import { promises as fs } from 'fs';
import path from 'path';
import GalaxyVisualization from '@/components/GalaxyVisualization';

export default async function Home() {
  const jsonPath = path.join(process.cwd(), 'pre-processing', 'initial_galaxy.json');
  const jsonContent = await fs.readFile(jsonPath, 'utf-8');
  const { particles } = JSON.parse(jsonContent);

  return <GalaxyVisualization particles={particles} />;
}
