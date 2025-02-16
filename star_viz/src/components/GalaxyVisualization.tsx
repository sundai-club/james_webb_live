'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface Point {
  x: number;
  y: number;
  intensity: number;
  size: number;
  color: string;
  type: 'star' | 'cloud' | 'center';
}

const ORIGINAL_WIDTH = 3214;
const ORIGINAL_HEIGHT = 3233;

export default function GalaxyVisualization({ points }: { points: Point[] }) {
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
  const [showClouds, setShowClouds] = useState(true);
  const [showCenter, setShowCenter] = useState(true);
  
  // Size multipliers for each type
  const [sizeMultipliers, setSizeMultipliers] = useState({
    star: 1,
    cloud: 1,
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
    if (!canvasRef.current || !imageLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = opacity;

    // Draw stars and clouds
    points.forEach((point) => {
      // Skip if type is hidden
      if (
        (point.type === 'star' && !showStars) ||
        (point.type === 'cloud' && !showClouds) ||
        (point.type === 'center' && !showCenter)
      ) return;

      // Convert from OpenCV (y,x) to canvas (x,y) coordinate system
      const x = point.y;  // OpenCV's y becomes our x
      const y = point.x;  // OpenCV's x becomes our y
      
      ctx.beginPath();
      const alpha = Math.round(point.intensity / 255 * 255).toString(16).padStart(2, '0');
      ctx.fillStyle = `${point.color}${alpha}`;
      ctx.arc(x, y, point.size * sizeMultipliers[point.type], 0, Math.PI * 2);
      ctx.fill();
    });
  }, [points, opacity, imageLoaded, offset, sizeMultipliers, showStars, showClouds, showCenter]);

  const updateSizeMultiplier = (type: 'star' | 'cloud' | 'center', value: number) => {
    setSizeMultipliers(prev => ({
      ...prev,
      [type]: value
    }));
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black">
      <div ref={containerRef} className="relative w-full h-full">
        <Image
          src="/pre-processing/NGC5468.png"
          alt="Galaxy"
          fill
          className={`object-contain transition-opacity duration-300 ${showBackground ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          priority
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
                  checked={showClouds}
                  onChange={(e) => setShowClouds(e.target.checked)}
                  className="w-4 h-4"
                />
                Clouds
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
              {showClouds && (
                <div className="space-y-1">
                  <label className="text-sm">Clouds</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.1"
                      value={sizeMultipliers.cloud}
                      onChange={(e) => updateSizeMultiplier('cloud', Number(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-sm">{sizeMultipliers.cloud}x</span>
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
