// Client-side image enhancement, applied conditionally by the image's long edge.
// Blanket enhancement degrades clean/color-coded/light-pencil inputs, so apply
// only where it helps. PDFs are NEVER canvas-processed.

const MAX_LONG_EDGE = 2200;
const LOW_DPI_THRESHOLD = 1400;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image."));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas, type = "image/jpeg", quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas export failed."));
    }, type, quality);
  });
}

/**
 * Returns a processed Blob for image files, or the original File for PDFs / unsupported.
 */
export async function enhanceImage(file) {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (isPdf) return { file, enhanced: false };

  const img = await loadImage(file).catch(() => null);
  if (!img) return { file, enhanced: false };

  const longEdge = Math.max(img.naturalWidth, img.naturalHeight);

  // In the sweet spot — send the original bytes untouched.
  if (longEdge > LOW_DPI_THRESHOLD && longEdge <= MAX_LONG_EDGE) {
    return { file, enhanced: false };
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (longEdge <= LOW_DPI_THRESHOLD) {
    // Faint / low-DPI scan rescue: grayscale + contrast boost + light sharpen.
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = data.data;
    for (let i = 0; i < d.length; i += 4) {
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      // Contrast boost around midpoint.
      let v = ((gray - 128) * 1.35) + 128;
      v = v < 0 ? 0 : v > 255 ? 255 : v;
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    ctx.putImageData(data, 0, 0);
    applyLightSharpen(ctx, canvas.width, canvas.height);
    const blob = await canvasToBlob(canvas, "image/jpeg", 0.95);
    return { file: new File([blob], replaceExt(file.name, ".jpg"), { type: "image/jpeg" }), enhanced: true };
  }

  // Large image: downscale to ~2200px long edge, KEEP COLOR, one light sharpen.
  const scale = MAX_LONG_EDGE / longEdge;
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  applyLightSharpen(ctx, canvas.width, canvas.height);
  const keepPng = file.type === "image/png";
  const blob = await canvasToBlob(canvas, keepPng ? "image/png" : "image/jpeg", 0.92);
  return {
    file: new File([blob], replaceExt(file.name, keepPng ? ".png" : ".jpg"), { type: keepPng ? "image/png" : "image/jpeg" }),
    enhanced: true,
  };
}

// Simple convolution sharpen kernel (light).
function applyLightSharpen(ctx, w, h) {
  try {
    const src = ctx.getImageData(0, 0, w, h);
    const out = ctx.createImageData(w, h);
    const s = src.data;
    const o = out.data;
    const k = [0, -0.5, 0, -0.5, 3, -0.5, 0, -0.5, 0];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        for (let c = 0; c < 3; c++) {
          let acc = 0;
          let ki = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = Math.min(w - 1, Math.max(0, x + dx));
              const ny = Math.min(h - 1, Math.max(0, y + dy));
              acc += s[(ny * w + nx) * 4 + c] * k[ki++];
            }
          }
          o[i + c] = acc < 0 ? 0 : acc > 255 ? 255 : acc;
        }
        o[i + 3] = s[i + 3];
      }
    }
    ctx.putImageData(out, 0, 0);
  } catch {
    // getImageData can fail on tainted canvases; enhancement is best-effort.
  }
}

function replaceExt(name, ext) {
  const dot = name.lastIndexOf(".");
  return (dot === -1 ? name : name.slice(0, dot)) + ext;
}