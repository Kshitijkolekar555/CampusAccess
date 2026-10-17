/**
 * Client-Side Image Compression & Optimization Utility
 * 
 * Downscales images to max dimensions while preserving aspect ratio,
 * and encodes to compressed JPEG blobs (~60KB - 90KB) for fast gate uploads
 * and optimal OpenCV YuNet/SFace neural recognition accuracy.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 to 1.0
  format?: 'image/jpeg' | 'image/webp';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.78,
  format: 'image/jpeg',
};

/**
 * Resizes and compresses an HTMLVideoElement or HTMLCanvasElement to a JPEG Blob & dataUrl.
 */
export const compressCanvasOrVideo = (
  source: HTMLVideoElement | HTMLCanvasElement,
  options: CompressionOptions = {}
): Promise<{ dataUrl: string; blob: Blob }> => {
  return new Promise((resolve, reject) => {
    try {
      const opts = { ...DEFAULT_OPTIONS, ...options };
      const srcWidth = source instanceof HTMLVideoElement ? source.videoWidth || 1280 : source.width;
      const srcHeight = source instanceof HTMLVideoElement ? source.videoHeight || 720 : source.height;

      if (!srcWidth || !srcHeight) {
        return reject(new Error('Source has invalid dimensions (0x0)'));
      }

      // Calculate bounded aspect ratio dimensions (max 800x800)
      let targetWidth = srcWidth;
      let targetHeight = srcHeight;
      const maxW = opts.maxWidth || 800;
      const maxH = opts.maxHeight || 800;

      if (targetWidth > maxW || targetHeight > maxH) {
        const ratio = Math.min(maxW / targetWidth, maxH / targetHeight);
        targetWidth = Math.round(targetWidth * ratio);
        targetHeight = Math.round(targetHeight * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        return reject(new Error('Failed to create canvas context'));
      }

      // High quality smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw downscaled frame
      ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

      const dataUrl = canvas.toDataURL(opts.format, opts.quality);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ dataUrl, blob });
          } else {
            reject(new Error('Failed to generate compressed image blob'));
          }
        },
        opts.format,
        opts.quality
      );
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Estimates sharpness of an HTMLCanvasElement using grayscale gradient variance (Laplacian approximation).
 * Higher variance indicates sharper edges, less motion blur, and optimal face features.
 */
export const calculateCanvasSharpness = (canvas: HTMLCanvasElement): number => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return 0;
  
  // Downsample to a small 160x120 patch for ultra-fast <5ms calculation
  const sampleW = 160;
  const sampleH = 120;
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = sampleW;
  sampleCanvas.height = sampleH;
  const sCtx = sampleCanvas.getContext('2d');
  if (!sCtx) return 0;

  sCtx.drawImage(canvas, 0, 0, sampleW, sampleH);
  const imgData = sCtx.getImageData(0, 0, sampleW, sampleH);
  const data = imgData.data;

  // Compute variance of adjacent pixel intensity differences (Laplacian derivative)
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = 1; y < sampleH - 1; y += 2) {
    for (let x = 1; x < sampleW - 1; x += 2) {
      const idx = (y * sampleW + x) * 4;
      // Convert to luminance
      const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      const lumRight = 0.299 * data[idx + 4] + 0.587 * data[idx + 5] + 0.114 * data[idx + 6];
      const lumDown = 0.299 * data[idx + sampleW * 4] + 0.587 * data[idx + sampleW * 4 + 1] + 0.114 * data[idx + sampleW * 4 + 2];
      
      const grad = Math.abs(lum - lumRight) + Math.abs(lum - lumDown);
      sum += grad;
      sumSq += grad * grad;
      count++;
    }
  }

  if (count === 0) return 0;
  const mean = sum / count;
  const variance = sumSq / count - mean * mean;
  return variance;
};

/**
 * Captures best frame out of N rapid frames across a time window (e.g. 3 frames over 200ms)
 * to eliminate camera motion blur and eye-blink artifacts.
 */
export const captureBestOfNFrames = async (
  video: HTMLVideoElement,
  frameCount: number = 3,
  intervalMs: number = 75,
  compressionOptions: CompressionOptions = {}
): Promise<{ dataUrl: string; blob: Blob; sharpness: number }> => {
  let bestScore = -1;
  let bestCanvas: HTMLCanvasElement | null = null;

  for (let i = 0; i < frameCount; i++) {
    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = video.videoWidth || 1280;
    frameCanvas.height = video.videoHeight || 720;
    const ctx = frameCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const score = calculateCanvasSharpness(frameCanvas);
      if (score > bestScore || !bestCanvas) {
        bestScore = score;
        bestCanvas = frameCanvas;
      }
    }
    if (i < frameCount - 1) {
      await new Promise((res) => setTimeout(res, intervalMs));
    }
  }

  if (!bestCanvas) {
    throw new Error('Failed to sample video frames');
  }

  const compressed = await compressCanvasOrVideo(bestCanvas, compressionOptions);
  return {
    ...compressed,
    sharpness: bestScore,
  };
};

/**
 * Compresses an existing File or Blob (e.g. from file upload)
 */
export const compressImageFile = (
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<{ dataUrl: string; blob: Blob }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(url);
      try {
        const result = await compressCanvasOrVideo(img as unknown as HTMLCanvasElement, options);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image file for compression'));
    };

    img.src = url;
  });
};
