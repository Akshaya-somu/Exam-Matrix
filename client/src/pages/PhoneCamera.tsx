import { useEffect, useRef, useState } from "react";
import { useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Video, CheckCircle2, Smartphone } from "lucide-react";
import io from "socket.io-client";

export default function PhoneCamera() {
  const [, params] = useRoute("/phone-camera/:sessionId");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string>("");
  const [streaming, setStreaming] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  useEffect(() => {
    if (!params?.sessionId) return;

    // Connect to WebSocket
    const socket = io({
      path: "/ws",
    });

    socket.on("connect", () => {
      console.log("Phone camera connected to server");
      setConnected(true);

      // Notify server that phone is connecting
      socket.emit("phone:connect", {
        sessionId: params.sessionId,
        studentId: "phone-camera",
        examId: "monitoring",
      });

      startCamera();
    });

    socket.on(
      "webrtc:offer",
      async (data: { from: string; offer: any; sessionId: string }) => {
        console.log("Received WebRTC offer from:", data.from);
        await handleOffer(data.from, data.offer);
      }
    );

    socket.on(
      "webrtc:ice-candidate",
      (data: { from: string; candidate: any }) => {
        console.log("Received ICE candidate from:", data.from);
        const pc = peerConnectionsRef.current.get(data.from);
        if (pc && data.candidate) {
          pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      }
    );

    socket.on("disconnect", () => {
      console.log("Phone camera disconnected");
      setConnected(false);
      stopCamera();
    });

    socketRef.current = socket;

    return () => {
      stopCamera();
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      socket.disconnect();
    };
  }, [params?.sessionId]);

  const startCamera = async () => {
    try {
      // Try to access camera - will throw proper error if not available
      const getUserMedia =
        navigator.mediaDevices?.getUserMedia ||
        (navigator as any).getUserMedia ||
        (navigator as any).webkitGetUserMedia ||
        (navigator as any).mozGetUserMedia;

      if (!getUserMedia) {
        // If mediaDevices is missing on HTTP, give specific instructions
        if (
          window.location.protocol === "http:" &&
          window.location.hostname !== "localhost" &&
          window.location.hostname !== "127.0.0.1"
        ) {
          throw new Error(
            "Camera API blocked on HTTP. Enable Chrome flag 'insecure origins treated as secure' and restart Chrome."
          );
        } else {
          throw new Error(
            "Camera API not supported in this browser. Please use Chrome or Safari."
          );
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user", // Use front camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setStreaming(true);
      setError("");

      // Notify that stream is ready
      socketRef.current?.emit("stream:started", {
        sessionId: params?.sessionId,
        type: "phone",
      });
    } catch (err: any) {
      console.error("Camera error:", err);

      // Provide specific error messages based on actual error
      let errorMessage = err.message || "Failed to access camera";

      if (err.name === "NotAllowedError") {
        errorMessage =
          "Camera permission denied. Please allow camera access in your browser settings.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "No camera found on this device.";
      } else if (err.name === "NotReadableError") {
        errorMessage = "Camera is already in use by another application.";
      } else if (err.name === "NotSupportedError" || err.name === "TypeError") {
        // Only show HTTPS error for actual security errors
        if (
          window.location.protocol === "http:" &&
          window.location.hostname !== "localhost" &&
          window.location.hostname !== "127.0.0.1"
        ) {
          errorMessage =
            "Camera access blocked on HTTP. Enable Chrome flag 'insecure origins treated as secure' or use HTTPS.";
        }
      }

      setError(errorMessage);
      setStreaming(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStreaming(false);
  };

  const handleOffer = async (
    socketId: string,
    offer: RTCSessionDescriptionInit
  ) => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      // Add camera stream tracks to peer connection
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, streamRef.current!);
        });
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current?.emit("webrtc:ice-candidate", {
            to: socketId,
            candidate: event.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("Connection state:", pc.connectionState);
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
          pc.close();
          peerConnectionsRef.current.delete(socketId);
        }
      };

      // Set remote description (offer) and create answer
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Send answer back
      socketRef.current?.emit("webrtc:answer", {
        to: socketId,
        answer: pc.localDescription,
      });

      peerConnectionsRef.current.set(socketId, pc);
    } catch (err) {
      console.error("Error handling offer:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-black flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-white/10 backdrop-blur-lg border-white/20">
        <CardContent className="p-8">
          <div className="flex items-center justify-center mb-6">
            <Smartphone className="h-12 w-12 text-white mr-3" />
            <h1 className="text-3xl font-bold text-white">Phone Camera</h1>
          </div>

          {/* Connection Status */}
          <div className="mb-6 flex items-center justify-center gap-2">
            {connected ? (
              <Badge className="bg-green-500 text-white">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge className="bg-yellow-500 text-white">Connecting...</Badge>
            )}
          </div>

          {/* Video Preview */}
          <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />

            {streaming && (
              <div className="absolute top-4 left-4">
                <Badge
                  variant="destructive"
                  className="flex items-center gap-1"
                >
                  <Video className="h-3 w-3" />
                  LIVE
                </Badge>
              </div>
            )}

            {!streaming && !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-white mb-2">Camera Error</p>
                  <p className="text-sm text-white/90 mb-3">{error}</p>

                  {(error.toLowerCase().includes("http") ||
                    error.toLowerCase().includes("chrome flag")) && (
                    <div className="bg-white/10 rounded p-3 text-xs text-white/90 space-y-2">
                      <p className="font-semibold text-white">
                        🔧 Chrome Setup Instructions:
                      </p>
                      <ol className="list-decimal list-inside space-y-1.5 ml-2">
                        <li>Open Chrome browser on your phone</li>
                        <li>
                          Type in address bar:{" "}
                          <code className="bg-white/20 px-1.5 py-0.5 rounded">
                            chrome://flags
                          </code>
                        </li>
                        <li>Search: "insecure origins treated as secure"</li>
                        <li>
                          Click "Add" and paste this URL:
                          <br />
                          <code className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] break-all">
                            {window.location.origin}
                          </code>
                        </li>
                        <li>Set dropdown to "Enabled"</li>
                        <li>Click "Relaunch" button at bottom</li>
                        <li>After Chrome restarts, scan QR code again</li>
                        <li>Click "Allow" when prompted for camera access</li>
                      </ol>
                      <p className="text-[10px] text-yellow-300 mt-2">
                        ⚠️ Make sure to copy the full URL and enable the flag
                        before relaunching
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="space-y-3 text-white/80">
            <p className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              Position your phone behind you for 360° monitoring
            </p>
            <p className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              Keep this page open during the entire exam
            </p>
            <p className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              Ensure stable internet connection
            </p>
            {streaming && (
              <p className="text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                Proctors can now see your camera feed
              </p>
            )}
          </div>

          {/* Retry Button */}
          {error && (
            <Button
              onClick={startCamera}
              className="w-full mt-6"
              variant="default"
            >
              Retry Camera Access
            </Button>
          )}
        </CardContent>
      </Card>

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
