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
  const [sizeMultiplier, setSizeMultiplier] = useState(1);

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
      // Convert from OpenCV (y,x) to canvas (x,y) coordinate system
      const x = point.y;  // OpenCV's y becomes our x
      const y = point.x;  // OpenCV's x becomes our y
      
      ctx.beginPath();
      const alpha = Math.round(point.intensity / 255 * 255).toString(16).padStart(2, '0');
      ctx.fillStyle = `${point.color}${alpha}`;
      ctx.arc(x, y, point.size * sizeMultiplier, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [points, opacity, imageLoaded, offset, sizeMultiplier]);

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
          <div className="space-y-2">
            <h3 className="text-lg">Size Multiplier</h3>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={sizeMultiplier}
                onChange={(e) => setSizeMultiplier(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-sm">{sizeMultiplier}x</span>
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
