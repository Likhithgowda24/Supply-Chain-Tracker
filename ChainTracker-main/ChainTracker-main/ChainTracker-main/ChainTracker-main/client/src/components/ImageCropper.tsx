import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Crop, RotateCcw, Maximize2 } from "lucide-react";
import { motion } from "framer-motion";

interface ImageCropperProps {
  imageSrc: string;
  onCrop: (croppedImage: string) => void;
  onClose: () => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageCropper({ imageSrc, onCrop, onClose }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [originalImageDimensions, setOriginalImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const [gridType, setGridType] = useState<"rule-of-thirds" | "grid-3x3" | "grid-4x4">("rule-of-thirds");
  const [maintainAspect, setMaintainAspect] = useState(false);
  const [cropWidth, setCropWidth] = useState(0);
  const [cropHeight, setCropHeight] = useState(0);

  // Load image and initialize crop area
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setOriginalImageDimensions({ width: img.width, height: img.height });
      const maxWidth = 600;
      const maxHeight = 450;
      const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
      const displayWidth = img.width * scale;
      const displayHeight = img.height * scale;

      setImageDimensions({ width: displayWidth, height: displayHeight });
      const defaultCrop = {
        x: displayWidth * 0.1,
        y: displayHeight * 0.1,
        width: displayWidth * 0.8,
        height: displayHeight * 0.8,
      };
      setCropArea(defaultCrop);
      setCropWidth(Math.round(defaultCrop.width));
      setCropHeight(Math.round(defaultCrop.height));
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const handleMouseDown = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    setIsDragging(true);
    setDragHandle(handle);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragHandle || !containerRef.current || !imageDimensions) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const minSize = 20;
    const maxWidth = imageDimensions.width;
    const maxHeight = imageDimensions.height;

    if (dragHandle === "move") {
      const newX = Math.max(0, Math.min(x - cropArea.width / 2, maxWidth - cropArea.width));
      const newY = Math.max(0, Math.min(y - cropArea.height / 2, maxHeight - cropArea.height));
      setCropArea((prev) => ({ ...prev, x: newX, y: newY }));
    } else {
      const newArea = { ...cropArea };
      const aspectRatio = cropArea.height / cropArea.width;

      if (dragHandle.includes("n")) {
        const newY = Math.max(0, Math.min(y, cropArea.y + cropArea.height - minSize));
        newArea.height = cropArea.y + cropArea.height - newY;
        newArea.y = newY;
        if (maintainAspect) newArea.width = newArea.height / aspectRatio;
      }
      if (dragHandle.includes("s")) {
        newArea.height = Math.max(minSize, Math.min(y - cropArea.y, maxHeight - cropArea.y));
        if (maintainAspect) newArea.width = newArea.height / aspectRatio;
      }
      if (dragHandle.includes("w")) {
        const newX = Math.max(0, Math.min(x, cropArea.x + cropArea.width - minSize));
        newArea.width = cropArea.x + cropArea.width - newX;
        newArea.x = newX;
        if (maintainAspect) newArea.height = newArea.width * aspectRatio;
      }
      if (dragHandle.includes("e")) {
        newArea.width = Math.max(minSize, Math.min(x - cropArea.x, maxWidth - cropArea.x));
        if (maintainAspect) newArea.height = newArea.width * aspectRatio;
      }

      setCropArea(newArea);
      setCropWidth(Math.round(newArea.width));
      setCropHeight(Math.round(newArea.height));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragHandle(null);
  };

  const applyCrop = () => {
    if (!imageRef.current || !canvasRef.current || !originalImageDimensions) return;

    const img = new Image();
    img.onload = () => {
      const scaleX = img.width / (imageDimensions?.width || 1);
      const scaleY = img.height / (imageDimensions?.height || 1);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const cropWidth = cropArea.width * scaleX;
      const cropHeight = cropArea.height * scaleY;
      const cropX = cropArea.x * scaleX;
      const cropY = cropArea.y * scaleY;

      canvas.width = cropWidth;
      canvas.height = cropHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      const croppedImage = canvas.toDataURL("image/jpeg", 0.95);
      onCrop(croppedImage);
    };
    img.src = imageSrc;
  };

  const resetCrop = () => {
    if (!imageDimensions) return;
    const newCrop = {
      x: imageDimensions.width * 0.1,
      y: imageDimensions.height * 0.1,
      width: imageDimensions.width * 0.8,
      height: imageDimensions.height * 0.8,
    };
    setCropArea(newCrop);
    setCropWidth(Math.round(newCrop.width));
    setCropHeight(Math.round(newCrop.height));
  };

  const expandToFull = () => {
    if (!imageDimensions) return;
    const newCrop = {
      x: 0,
      y: 0,
      width: imageDimensions.width,
      height: imageDimensions.height,
    };
    setCropArea(newCrop);
    setCropWidth(Math.round(newCrop.width));
    setCropHeight(Math.round(newCrop.height));
  };

  const applyPreset = (aspectRatio: number) => {
    if (!imageDimensions) return;
    const currentRatio = cropArea.width / cropArea.height;
    let newWidth, newHeight;

    if (currentRatio > aspectRatio) {
      newHeight = cropArea.height;
      newWidth = newHeight * aspectRatio;
    } else {
      newWidth = cropArea.width;
      newHeight = newWidth / aspectRatio;
    }

    // Center the crop area
    const newX = cropArea.x + (cropArea.width - newWidth) / 2;
    const newY = cropArea.y + (cropArea.height - newHeight) / 2;

    const newCrop = {
      x: Math.max(0, Math.min(newX, imageDimensions.width - newWidth)),
      y: Math.max(0, Math.min(newY, imageDimensions.height - newHeight)),
      width: newWidth,
      height: newHeight,
    };
    setCropArea(newCrop);
    setCropWidth(Math.round(newCrop.width));
    setCropHeight(Math.round(newCrop.height));
  };

  const handleDimensionChange = (width: number, height: number) => {
    if (!imageDimensions) return;
    const maxWidth = imageDimensions.width;
    const maxHeight = imageDimensions.height;
    const clampedWidth = Math.max(20, Math.min(width, maxWidth));
    const clampedHeight = Math.max(20, Math.min(height, maxHeight));
    const clampedX = Math.max(0, Math.min(cropArea.x, maxWidth - clampedWidth));
    const clampedY = Math.max(0, Math.min(cropArea.y, maxHeight - clampedHeight));

    setCropArea({
      x: clampedX,
      y: clampedY,
      width: clampedWidth,
      height: clampedHeight,
    });
    setCropWidth(clampedWidth);
    setCropHeight(clampedHeight);
  };

  const renderGrid = () => {
    if (!imageDimensions) return null;

    const lines = [];
    const { width, height } = imageDimensions;

    if (gridType === "rule-of-thirds") {
      for (let i = 1; i <= 2; i++) {
        lines.push(
          <line
            key={`v${i}`}
            x1={width / 3 * i}
            y1="0"
            x2={width / 3 * i}
            y2={height}
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="1"
          />,
          <line
            key={`h${i}`}
            x1="0"
            y1={height / 3 * i}
            x2={width}
            y2={height / 3 * i}
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="1"
          />
        );
      }
    } else if (gridType === "grid-3x3") {
      for (let i = 1; i <= 2; i++) {
        lines.push(
          <line
            key={`v${i}`}
            x1={width / 3 * i}
            y1="0"
            x2={width / 3 * i}
            y2={height}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="1"
          />,
          <line
            key={`h${i}`}
            x1="0"
            y1={height / 3 * i}
            x2={width}
            y2={height / 3 * i}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="1"
          />
        );
      }
    } else if (gridType === "grid-4x4") {
      for (let i = 1; i <= 3; i++) {
        lines.push(
          <line
            key={`v${i}`}
            x1={width / 4 * i}
            y1="0"
            x2={width / 4 * i}
            y2={height}
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="1"
          />,
          <line
            key={`h${i}`}
            x1="0"
            y1={height / 4 * i}
            x2={width}
            y2={height / 4 * i}
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="1"
          />
        );
      }
    }

    return lines;
  };

  if (!imageDimensions) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      >
        <Card className="p-8">
          <p className="text-muted-foreground">Loading image...</p>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
    >
      <Card className="w-full max-w-3xl p-6 space-y-4 my-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Crop Image</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-testid="button-close-cropper"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-3">
          {/* Grid Type Selection */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={gridType === "rule-of-thirds" ? "default" : "outline"}
              onClick={() => setGridType("rule-of-thirds")}
              data-testid="button-grid-rule-of-thirds"
            >
              Rule of Thirds
            </Button>
            <Button
              size="sm"
              variant={gridType === "grid-3x3" ? "default" : "outline"}
              onClick={() => setGridType("grid-3x3")}
              data-testid="button-grid-3x3"
            >
              3x3 Grid
            </Button>
            <Button
              size="sm"
              variant={gridType === "grid-4x4" ? "default" : "outline"}
              onClick={() => setGridType("grid-4x4")}
              data-testid="button-grid-4x4"
            >
              4x4 Grid
            </Button>
          </div>

          {/* Aspect Ratio Presets */}
          <div className="flex flex-wrap gap-2">
            <Label className="w-full text-sm font-semibold">Aspect Ratios:</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => applyPreset(1)}
              data-testid="button-aspect-square"
            >
              1:1 Square
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => applyPreset(16 / 9)}
              data-testid="button-aspect-16x9"
            >
              16:9
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => applyPreset(4 / 3)}
              data-testid="button-aspect-4x3"
            >
              4:3
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => applyPreset(3 / 2)}
              data-testid="button-aspect-3x2"
            >
              3:2
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => applyPreset(9 / 16)}
              data-testid="button-aspect-9x16"
            >
              9:16 Portrait
            </Button>
          </div>

          {/* Crop Preview with Grid */}
          <div
            ref={containerRef}
            className="relative bg-black rounded-lg overflow-hidden inline-block border-2 border-blue-500"
            style={{
              width: imageDimensions.width,
              height: imageDimensions.height,
              cursor: dragHandle ? "grabbing" : "grab",
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop preview"
              style={{
                width: imageDimensions.width,
                height: imageDimensions.height,
                display: "block",
              }}
              data-testid="img-crop-preview"
            />

            {/* Grid Overlay */}
            <svg
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: imageDimensions.width,
                height: imageDimensions.height,
              }}
              data-testid="svg-grid"
            >
              {renderGrid()}
            </svg>

            {/* Darken outside crop area */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: imageDimensions.width,
                height: imageDimensions.height,
                pointerEvents: "none",
              }}
            >
              {/* Top */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: cropArea.y,
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                }}
              />
              {/* Bottom */}
              <div
                style={{
                  position: "absolute",
                  top: cropArea.y + cropArea.height,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                }}
              />
              {/* Left */}
              <div
                style={{
                  position: "absolute",
                  top: cropArea.y,
                  left: 0,
                  width: cropArea.x,
                  height: cropArea.height,
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                }}
              />
              {/* Right */}
              <div
                style={{
                  position: "absolute",
                  top: cropArea.y,
                  left: cropArea.x + cropArea.width,
                  right: 0,
                  height: cropArea.height,
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                }}
              />
            </div>

            {/* Crop Box Border */}
            <div
              style={{
                position: "absolute",
                top: cropArea.y,
                left: cropArea.x,
                width: cropArea.width,
                height: cropArea.height,
                border: "2px solid #3b82f6",
                boxSizing: "border-box",
                cursor: "grab",
              }}
              onMouseDown={(e) => handleMouseDown(e, "move")}
              data-testid="div-crop-area"
            >
              {/* Corner and Edge Handles */}
              {[
                { name: "nw", top: -8, left: -8, cursor: "nwse-resize" },
                { name: "n", top: -8, left: "50%", cursor: "ns-resize", transform: "translateX(-50%)" },
                { name: "ne", top: -8, right: -8, cursor: "nesw-resize" },
                { name: "w", top: "50%", left: -8, cursor: "ew-resize", transform: "translateY(-50%)" },
                { name: "e", top: "50%", right: -8, cursor: "ew-resize", transform: "translateY(-50%)" },
                { name: "sw", bottom: -8, left: -8, cursor: "nesw-resize" },
                { name: "s", bottom: -8, left: "50%", cursor: "ns-resize", transform: "translateX(-50%)" },
                { name: "se", bottom: -8, right: -8, cursor: "nwse-resize" },
              ].map((handle) => (
                <div
                  key={handle.name}
                  style={{
                    position: "absolute",
                    top: handle.top,
                    left: handle.left,
                    right: handle.right,
                    bottom: handle.bottom,
                    width: 16,
                    height: 16,
                    backgroundColor: "#3b82f6",
                    border: "2px solid white",
                    borderRadius: "3px",
                    cursor: handle.cursor,
                    transform: handle.transform as any,
                    zIndex: 10,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, handle.name)}
                  data-testid={`handle-${handle.name}`}
                />
              ))}
            </div>
          </div>

          {/* Dimensions and Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width-input">Width (px)</Label>
              <Input
                id="width-input"
                type="number"
                min="20"
                value={cropWidth}
                onChange={(e) => handleDimensionChange(parseInt(e.target.value) || cropWidth, cropHeight)}
                data-testid="input-crop-width"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height-input">Height (px)</Label>
              <Input
                id="height-input"
                type="number"
                min="20"
                value={cropHeight}
                onChange={(e) => handleDimensionChange(cropWidth, parseInt(e.target.value) || cropHeight)}
                data-testid="input-crop-height"
              />
            </div>
          </div>

          {/* Maintain Aspect Ratio */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="aspectRatio"
              checked={maintainAspect}
              onChange={(e) => setMaintainAspect(e.target.checked)}
              data-testid="checkbox-aspect-ratio"
            />
            <Label htmlFor="aspectRatio" className="cursor-pointer">
              Lock Aspect Ratio
            </Label>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={resetCrop}
              data-testid="button-reset-crop"
              size="sm"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={expandToFull}
              data-testid="button-expand-full"
              size="sm"
            >
              <Maximize2 className="w-4 h-4 mr-2" />
              Full Image
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              data-testid="button-cancel-crop"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={applyCrop}
              className="flex-1"
              data-testid="button-apply-crop"
            >
              <Crop className="w-4 h-4 mr-2" />
              Apply Crop
            </Button>
          </div>
        </div>

        {/* Hidden canvas for cropping */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </Card>
    </motion.div>
  );
}
