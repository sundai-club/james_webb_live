import { promises as fs } from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import GalaxyVisualization from '@/components/GalaxyVisualization';

export default async function Home() {
  const csvPath = path.join(process.cwd(), 'pre-processing', 'galaxy_points.csv');
  const csvContent = await fs.readFile(csvPath, 'utf-8');
  const points = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    cast: (value, context) => {
      if (context.column === 'x' || context.column === 'y' || context.column === 'intensity') {
        return parseFloat(value);
      }
      return value;
    },
  });

  return <GalaxyVisualization points={points} />;
}
