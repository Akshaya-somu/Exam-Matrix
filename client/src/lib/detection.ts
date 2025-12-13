export interface DetectionResult {
  type:
    | "tab_switch"
    | "multiple_faces"
    | "absent"
    | "phone_detected"
    | "looking_away";
  confidence: number;
  timestamp: Date;
}

export class DetectionService {
  private lastFaceCount = 1;
  private tabSwitchCount = 0;
  private lastActiveTime = Date.now();

  // Simulate face detection (in production, use TensorFlow.js or similar)
  async detectFaces(imageData: string): Promise<number> {
    // Simulate API call to face detection service
    return new Promise((resolve) => {
      setTimeout(() => {
        // Random simulation for demo
        const random = Math.random();
        if (random > 0.95) resolve(0); // No face
        else if (random > 0.9) resolve(2); // Multiple faces
        else resolve(1); // Normal
      }, 100);
    });
  }

  async analyzeFrame(imageData: string): Promise<DetectionResult[]> {
    const alerts: DetectionResult[] = [];
    const faceCount = await this.detectFaces(imageData);

    // Check for multiple faces
    if (faceCount > 1 && this.lastFaceCount <= 1) {
      alerts.push({
        type: "multiple_faces",
        confidence: 0.85,
        timestamp: new Date(),
      });
    }

    // Check for absence
    if (faceCount === 0 && this.lastFaceCount > 0) {
      alerts.push({
        type: "absent",
        confidence: 0.9,
        timestamp: new Date(),
      });
    }

    this.lastFaceCount = faceCount;
    return alerts;
  }

  detectTabSwitch() {
    this.tabSwitchCount++;
    return {
      type: "tab_switch" as const,
      confidence: 1.0,
      timestamp: new Date(),
    };
  }

  resetCounters() {
    this.tabSwitchCount = 0;
    this.lastActiveTime = Date.now();
  }

  getStats() {
    return {
      tabSwitchCount: this.tabSwitchCount,
      sessionDuration: Date.now() - this.lastActiveTime,
    };
  }
}
