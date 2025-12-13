export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;

  async startCamera(videoElement: HTMLVideoElement, deviceId?: string) {
    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { width: 1280, height: 720 },
        audio: true,
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = this.localStream;
      return this.localStream;
    } catch (error) {
      console.error("Error accessing camera:", error);
      throw error;
    }
  }

  async getAvailableDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return {
      videoDevices: devices.filter((d) => d.kind === "videoinput"),
      audioDevices: devices.filter((d) => d.kind === "audioinput"),
    };
  }

  stopCamera() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }

  captureFrame(videoElement: HTMLVideoElement): string {
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(videoElement, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.8);
  }
}
