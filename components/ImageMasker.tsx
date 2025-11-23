import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Eraser, RefreshCw } from 'lucide-react';

export interface ImageMaskerRef {
  getMaskedImage: () => string;
  clearMask: () => void;
}

interface ImageMaskerProps {
  imageUrl: string;
}

export const ImageMasker = forwardRef<ImageMaskerRef, ImageMaskerProps>(({ imageUrl }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasMask, setHasMask] = useState(false);

  // Initialize canvas with image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      imageRef.current = img;
      resetCanvas();
    };
  }, [imageUrl]);

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    // Set canvas to match image's natural resolution
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0);
    }
    setHasMask(false);
  };

  useImperativeHandle(ref, () => ({
    getMaskedImage: () => {
      const canvas = canvasRef.current;
      return canvas ? canvas.toDataURL('image/jpeg', 0.9) : imageUrl;
    },
    clearMask: resetCanvas
  }));

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = (event as React.MouseEvent).clientX;
      clientY = (event as React.MouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    setHasMask(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      
      // Style for the mask
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)'; // Red transparent mask
      ctx.lineWidth = Math.max(30, (canvasRef.current?.width || 1000) / 25); // Dynamic brush size
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault(); // Prevent scrolling while drawing on touch
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }
  };

  return (
    <div className="relative w-full h-full group">
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain touch-none cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      
      {/* Floating Toolbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-gray-900/80 backdrop-blur-md p-2 rounded-full border border-gray-700 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
         <button 
           onClick={resetCanvas}
           className="p-2 rounded-full hover:bg-gray-700 text-white transition-colors"
           title="Clear Mask"
         >
           <RefreshCw size={20} />
         </button>
         <div className="h-auto w-px bg-gray-600 mx-1"></div>
         <div className="flex items-center px-3 text-xs font-medium text-gray-300 select-none">
            <Eraser size={14} className="mr-2 text-red-400" />
            Paint to Remove
         </div>
      </div>

      {/* Instruction Overlay (fades out if mask exists) */}
      {!hasMask && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center">
          <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10">
            <p className="text-white font-medium text-sm flex items-center gap-2">
              <Eraser size={16} />
              Paint over objects to remove
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

ImageMasker.displayName = 'ImageMasker';