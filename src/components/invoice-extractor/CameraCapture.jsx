import { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, X, Check, AlertTriangle, Loader2 } from "lucide-react";

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setReady(true);
      })
      .catch((e) => setError(e.message || "Camera unavailable"));
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const snap = async () => {
    const video = videoRef.current;
    if (!video) return;
    setCapturing(true);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture(file);
      }
      setCapturing(false);
    }, "image/jpeg", 0.92);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-foreground">
          <Camera className="h-5 w-5 text-accent" aria-hidden="true" />
          <h3 className="font-display text-lg">Take a photo</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Close camera"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {error ? (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <span>Camera unavailable: {error}. You can still upload files instead.</span>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-lg bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full"
            aria-label="Live camera preview"
          />
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center text-white/80">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            </div>
          )}
        </div>
      )}

      {!error && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={snap}
            disabled={!ready || capturing}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {capturing ? <Check className="h-4 w-4" aria-hidden="true" /> : <Camera className="h-4 w-4" aria-hidden="true" />}
            {capturing ? "Added" : "Capture & add"}
          </button>
          <button
            type="button"
            onClick={() => videoRef.current?.play().catch(() => {})}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retake
          </button>
        </div>
      )}
    </div>
  );
}