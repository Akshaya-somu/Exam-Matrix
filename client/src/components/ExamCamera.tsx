import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Smartphone, AlertCircle } from "lucide-react";
import { WebRTCManager } from "@/lib/webrtc";

interface ExamCameraProps {
  sessionId: string;
  onAlert: (alert: any) => void;
  type: "laptop" | "phone";
}

export default function ExamCamera({
  sessionId,
  onAlert,
  type,
}: ExamCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string>("");
  const webrtcRef = useRef(new WebRTCManager());

  useEffect(() => {
    startCamera();
    return () => {
      webrtcRef.current.stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      if (videoRef.current) {
        await webrtcRef.current.startCamera(videoRef.current);
        setIsActive(true);
        setError("");
      }
    } catch (err) {
      setError("Unable to access camera");
      console.error(err);
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
        {type === "laptop" ? (
          <Badge className="bg-blue-600">
            <Camera className="w-3 h-3 mr-1" />
            Laptop Camera
          </Badge>
        ) : (
          <Badge className="bg-purple-600">
            <Smartphone className="w-3 h-3 mr-1" />
            Phone Camera
          </Badge>
        )}
        {isActive && (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
            Live
          </Badge>
        )}
      </div>

      {error && (
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            {error}
          </Badge>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover bg-black"
        style={{ aspectRatio: "16/9" }}
      />
    </Card>
  );
}
