import React, { useCallback } from 'react';

interface GalaxyData {
  particles: {
    position: [number, number, number];
    velocity: [number, number, number];
    color: [number, number, number];
    mass: number;
  }[];
}

interface GalaxySelectorProps {
  onSelect: (source: string, data?: GalaxyData) => void;
  onBack?: () => void;
}

const GalaxySelector: React.FC<GalaxySelectorProps> = ({ onSelect, onBack }) => {
  const validateGalaxyData = (data: any): data is GalaxyData => {
    if (!data?.particles?.length) return false;
    return data.particles.every((p: any) => 
      Array.isArray(p.position) && p.position.length === 3 &&
      Array.isArray(p.velocity) && p.velocity.length === 3 &&
      Array.isArray(p.color) && p.color.length === 3 &&
      typeof p.mass === 'number'
    );
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (validateGalaxyData(data)) {
            onSelect('file', data);
          } else {
            alert('Invalid galaxy file format. Please check the file structure.');
          }
        } catch (error) {
          console.error('Error parsing JSON file:', error);
          alert('Invalid JSON file format');
        }
      };
      reader.readAsText(file);
    }
  }, [onSelect]);

  return (
    <div className="galaxy-selector">
      {onBack && (
        <button className="back-button" onClick={onBack}>
          ← Back to Information
        </button>
      )}
      <h1>Galaxy Simulator</h1>
      <div className="galaxy-options">
        <button onClick={() => onSelect('initial')}>
          Load Sample Galaxy
        </button>
        <div className="upload-section">
          <p>Or upload your own galaxy configuration:</p>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            id="galaxy-upload"
          />
          <small style={{ opacity: 0.7 }}>
            File must be JSON with particle positions, velocities, colors, and masses
          </small>
        </div>
      </div>
    </div>
  );
};

export default GalaxySelector;