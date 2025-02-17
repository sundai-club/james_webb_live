import { useEffect, useRef, useState } from 'react';

export interface Point {
  position: [number, number, number];
  imageCoords: [number, number];  // Original image coordinates [x, y]
  intensity: number;
  mass: number;
  color: string;
  type: 'star' | 'particle' | 'center';
}

const ORIGINAL_WIDTH = 3214;
const ORIGINAL_HEIGHT = 3233;

export default function GalaxyVisualization({ particles }: { particles: Point[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [opacity, setOpacity] = useState(0.8);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(false);
  const [showBackground, setShowBackground] = useState(true);
  
  // Visibility toggles for each type
  const [showStars, setShowStars] = useState(true);
  const [showParticles, setShowParticles] = useState(true);
  const [showCenter, setShowCenter] = useState(true);
  
  // Size multipliers for each type
  const [sizeMultipliers, setSizeMultipliers] = useState({
    star: 1,
    particle: 1,
    center: 1
  });

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current || !canvasRef.current) return;
      
      const container = containerRef.current;
      const containerAspect = container.clientWidth / container.clientHeight;
      const imageAspect = ORIGINAL_WIDTH / ORIGINAL_HEIGHT;
      
      let newScale;
      let xOffset = 0;
      let yOffset = 0;

      if (containerAspect > imageAspect) {
        // Container is wider than image
        newScale = container.clientHeight / ORIGINAL_HEIGHT;
        xOffset = (container.clientWidth - (ORIGINAL_WIDTH * newScale)) / 2;
      } else {
        // Container is taller than image
        newScale = container.clientWidth / ORIGINAL_WIDTH;
        yOffset = (container.clientHeight - (ORIGINAL_HEIGHT * newScale)) / 2;
      }
      
      setScale(newScale);
      setOffset({ x: xOffset, y: yOffset });
      
      const canvas = canvasRef.current;
      canvas.width = ORIGINAL_WIDTH;
      canvas.height = ORIGINAL_HEIGHT;
      canvas.style.transform = `scale(${newScale})`;
      canvas.style.transformOrigin = 'top left';
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw points
      particles.forEach((point) => {
        // Skip if type is hidden
        if (
          (point.type === 'star' && !showStars) ||
          (point.type === 'particle' && !showParticles) ||
          (point.type === 'center' && !showCenter)
        ) {
          return;
        }

        const [x, y] = point.position;
        
        // Transform coordinates to screen space
        const screenX = ((x + 1) / 2) * canvas.width;
        const screenY = ((y + 1) / 2) * canvas.height;
        
        // Calculate size based on mass (using cube root for visual scaling)
        const baseSize = Math.cbrt(point.mass) * 2;
        const size = baseSize * (sizeMultipliers[point.type] || 1);

        ctx.beginPath();
        ctx.arc(
          screenX,
          screenY,
          size,
          0,
          2 * Math.PI
        );
        ctx.fillStyle = point.color;
        ctx.globalAlpha = opacity;
        ctx.fill();
      });
    };

    draw();
  }, [particles, opacity, showStars, showParticles, showCenter, sizeMultipliers]);

  const updateSizeMultiplier = (type: 'star' | 'particle' | 'center', value: number) => {
    setSizeMultipliers(prev => ({
      ...prev,
      [type]: value
    }));
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black">
      <div ref={containerRef} className="relative w-full h-full">
        <img
          src="/pre-processing/NGC5468.png"
          alt="Galaxy"
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${showBackground ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
        />
        <canvas
          ref={canvasRef}
          className="absolute"
          style={{
            width: ORIGINAL_WIDTH,
            height: ORIGINAL_HEIGHT,
            left: `${offset.x}px`,
            top: `${offset.y}px`
          }}
        />
      </div>
      
      {/* Controls toggle button */}
      <button 
        onClick={() => setShowControls(prev => !prev)}
        className="fixed top-4 right-4 bg-black/50 text-white px-4 py-2 rounded-full hover:bg-black/70"
      >
        {showControls ? 'Hide Controls' : 'Show Controls'}
      </button>

      {/* Background toggle button */}
      <button 
        onClick={() => setShowBackground(prev => !prev)}
        className="fixed top-4 right-36 bg-black/50 text-white px-4 py-2 rounded-full hover:bg-black/70"
      >
        {showBackground ? 'Hide Background' : 'Show Background'}
      </button>

      {/* Controls panel */}
      {showControls && (
        <div className="fixed right-4 top-16 bg-black/80 p-6 rounded-lg text-white space-y-6 max-w-xs">
          {/* Visibility toggles */}
          <div className="space-y-2">
            <h3 className="text-lg">Visibility</h3>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showStars}
                  onChange={(e) => setShowStars(e.target.checked)}
                  className="w-4 h-4"
                />
                Stars
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showParticles}
                  onChange={(e) => setShowParticles(e.target.checked)}
                  className="w-4 h-4"
                />
                Particles
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showCenter}
                  onChange={(e) => setShowCenter(e.target.checked)}
                  className="w-4 h-4"
                />
                Black Hole
              </label>
            </div>
          </div>

          {/* Size controls */}
          <div className="space-y-4">
            <h3 className="text-lg">Size Controls</h3>
            <div className="space-y-4">
              {showStars && (
                <div className="space-y-1">
                  <label className="text-sm">Stars</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.1"
                      value={sizeMultipliers.star}
                      onChange={(e) => updateSizeMultiplier('star', Number(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-sm">{sizeMultipliers.star}x</span>
                  </div>
                </div>
              )}
              {showParticles && (
                <div className="space-y-1">
                  <label className="text-sm">Particles</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.1"
                      value={sizeMultipliers.particle}
                      onChange={(e) => updateSizeMultiplier('particle', Number(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-sm">{sizeMultipliers.particle}x</span>
                  </div>
                </div>
              )}
              {showCenter && (
                <div className="space-y-1">
                  <label className="text-sm">Black Hole</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.1"
                      value={sizeMultipliers.center}
                      onChange={(e) => updateSizeMultiplier('center', Number(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-sm">{sizeMultipliers.center}x</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Opacity control */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/50 px-6 py-3 rounded-full">
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          className="w-48"
        />
        <span className="text-sm text-white">{Math.round(opacity * 100)}%</span>
      </div>
    </div>
  );
}
