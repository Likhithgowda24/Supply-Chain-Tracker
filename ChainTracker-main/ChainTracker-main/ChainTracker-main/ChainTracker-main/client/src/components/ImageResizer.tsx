import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { X, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

interface ImageResizerProps {
  imageSrc: string;
  onResize: (resizedImage: string) => void;
  onClose: () => void;
}

export function ImageResizer({ imageSrc, onResize, onClose }: ImageResizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [quality, setQuality] = useState(0.9);

  // Load image and get original dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setOriginalDimensions({ width: img.width, height: img.height });
      setWidth(Math.min(800, img.width));
      setHeight(Math.min(600, img.height));
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth);
    if (maintainAspectRatio && originalDimensions) {
      const aspectRatio = originalDimensions.height / originalDimensions.width;
      setHeight(Math.round(newWidth * aspectRatio));
    }
  };

  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight);
    if (maintainAspectRatio && originalDimensions) {
      const aspectRatio = originalDimensions.width / originalDimensions.height;
      setWidth(Math.round(newHeight * aspectRatio));
    }
  };

  const resetToOriginal = () => {
    if (originalDimensions) {
      setWidth(originalDimensions.width);
      setHeight(originalDimensions.height);
    }
  };

  const resizeImage = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, width, height);
      const resizedImage = canvas.toDataURL("image/jpeg", quality);
      onResize(resizedImage);
      onClose();
    };
    img.src = imageSrc;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <Card className="w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Resize Image</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-testid="button-close-resizer"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Preview */}
          <div className="bg-secondary rounded-lg p-4 flex items-center justify-center max-h-64 overflow-hidden">
            <img
              src={imageSrc}
              alt="Preview"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                width: `${Math.min(width, 400)}px`,
                height: "auto",
              }}
              data-testid="img-preview"
            />
          </div>

          {/* Size Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Width (px)</Label>
              <Input
                id="width"
                type="number"
                min="100"
                max="4000"
                value={width}
                onChange={(e) => handleWidthChange(Math.max(100, parseInt(e.target.value) || 0))}
                data-testid="input-width"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Height (px)</Label>
              <Input
                id="height"
                type="number"
                min="100"
                max="4000"
                value={height}
                onChange={(e) => handleHeightChange(Math.max(100, parseInt(e.target.value) || 0))}
                data-testid="input-height"
              />
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="aspectRatio"
              checked={maintainAspectRatio}
              onChange={(e) => setMaintainAspectRatio(e.target.checked)}
              data-testid="checkbox-aspect-ratio"
            />
            <Label htmlFor="aspectRatio" className="cursor-pointer">
              Maintain Aspect Ratio
            </Label>
          </div>

          {/* Quality */}
          <div className="space-y-2">
            <Label htmlFor="quality">Image Quality: {Math.round(quality * 100)}%</Label>
            <input
              id="quality"
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              className="w-full"
              data-testid="slider-quality"
            />
          </div>

          {/* Original Dimensions Info */}
          {originalDimensions && (
            <p className="text-xs text-muted-foreground">
              Original: {originalDimensions.width}x{originalDimensions.height}px
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={resetToOriginal}
              data-testid="button-reset"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              data-testid="button-cancel-resize"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={resizeImage}
              className="flex-1"
              data-testid="button-apply-resize"
            >
              Apply Resize
            </Button>
          </div>
        </div>

        {/* Hidden canvas for resizing */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </Card>
    </motion.div>
  );
}
