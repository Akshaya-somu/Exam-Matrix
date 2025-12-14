# Phone Camera Connection Feature

## Overview

The phone camera connection feature enables students to connect their mobile phones as a secondary camera during exams, providing 360° monitoring for proctors. Students scan a QR code to connect their phone camera, which streams live video to proctors in real-time.

## ✅ Implemented Components

### 1. Server-Side (Backend)

#### **Enhanced WebSocket Signaling** ([server/routes.ts](server/routes.ts))

- **WebRTC Peer Connection Management**

  - `phone:connect` - Phone camera connects to session
  - `webrtc:offer` - Initiates peer connection with offer
  - `webrtc:answer` - Responds to peer connection offer
  - `webrtc:ice-candidate` - Exchanges ICE candidates for NAT traversal
  - `stream:started` - Notifies when stream is active
  - Active streams tracking with Map data structure

- **QR Code Generation Endpoint**
  - `GET /api/sessions/:id/qrcode` - Generates QR code for phone connection
  - Returns QR code as data URL and connection URL
  - Uses `qrcode` library with 300x300px resolution
  - Customizable colors (black on white)

#### **Features**:

- Room-based WebSocket communication (`exam:{examId}`, `session:{sessionId}`)
- Automatic cleanup on disconnect
- STUN server configuration for WebRTC
- Stream status broadcasting to proctor dashboard

### 2. Client-Side Components

#### **Phone Camera Page** ([client/src/pages/PhoneCamera.tsx](client/src/pages/PhoneCamera.tsx))

**Purpose**: Mobile-optimized page for phone camera streaming

**Features**:

- ✅ Auto-connects to WebSocket on page load
- ✅ Requests camera permissions (front-facing camera)
- ✅ 720p video resolution (1280x720)
- ✅ WebRTC peer connection with proctor viewers
- ✅ Real-time connection status indicators
- ✅ Mirror effect for natural preview
- ✅ LIVE badge when streaming
- ✅ Connection instructions overlay
- ✅ Error handling with retry button
- ✅ Auto-cleanup on page close

**UI Design**:

- Gradient background (blue-900 to purple-900 to black)
- Glassmorphism card design (backdrop blur)
- Status badges (Connected/Connecting)
- Video preview with aspect ratio preservation
- Step-by-step instructions

#### **Enhanced Student Exam Interface** ([client/src/pages/student/EnhancedTakeExam.tsx](client/src/pages/student/EnhancedTakeExam.tsx))

**New Features Added**:

- ✅ QR code display card in sidebar
- ✅ Laptop webcam video feed with LIVE badge
- ✅ Auto-fetches QR code on session creation
- ✅ Camera permission handling
- ✅ Webcam initialization (640x480)
- ✅ Collapsible QR code card
- ✅ Video refs for both cameras
- ✅ Connection status tracking

**UI Updates**:

- Webcam feed card with live indicator
- QR code card with:
  - QR code image display
  - 4-step connection instructions
  - Close button
  - Blue gradient styling
- Camera status badges in monitoring section

### 3. Routing

#### **App.tsx Updates**

- ✅ New public route: `/phone-camera/:sessionId`
- ✅ No authentication required for phone camera page
- ✅ Session ID passed via URL parameter

## 🎯 User Flow

### Student Flow:

1. Student logs in and navigates to exam
2. Student starts exam → Session created
3. QR code automatically generated and displayed in sidebar
4. Student sees:
   - Laptop webcam feed (top right)
   - QR code card with instructions (below webcam)
   - Live monitoring status

### Phone Connection Flow:

1. Student scans QR code with phone camera/QR scanner
2. Phone opens `/phone-camera/{sessionId}` URL
3. Browser requests camera permission
4. Phone camera connects via WebSocket
5. WebRTC peer connection established
6. Video streams to proctor dashboard
7. Student sees "Connected" status badge
8. Proctor sees phone camera feed in grid

### Proctor Flow:

1. Proctor navigates to Enhanced Live Monitor
2. Sees grid of student video feeds
3. Each student card shows:
   - Laptop camera feed (when available)
   - Phone camera feed (when connected)
   - Connection status
   - Alert count

## 🔧 Technical Details

### WebRTC Configuration

```javascript
{
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];
}
```

### QR Code Generation

```javascript
QRCode.toDataURL(connectionUrl, {
  width: 300,
  margin: 2,
  color: {
    dark: "#000000",
    light: "#FFFFFF",
  },
});
```

### Video Constraints

**Laptop Camera**:

```javascript
{
  video: { width: 640, height: 480 },
  audio: false
}
```

**Phone Camera**:

```javascript
{
  video: {
    facingMode: "user", // Front camera
    width: { ideal: 1280 },
    height: { ideal: 720 }
  },
  audio: false
}
```

## 🎨 UI Components Used

### Student Exam Interface:

- `Card` - Container for webcam and QR code
- `Badge` - Status indicators (LIVE, Connected)
- `Button` - Close QR code card
- `video` - HTML5 video elements with refs

### Phone Camera Page:

- `Card` with glassmorphism
- `Badge` - Connection status
- `video` - Camera preview
- `AlertCircle` - Error icon
- `Smartphone` - Phone icon

## 📡 WebSocket Events

### Client → Server:

| Event                  | Data                               | Purpose                          |
| ---------------------- | ---------------------------------- | -------------------------------- |
| `phone:connect`        | `{ sessionId, studentId, examId }` | Register phone camera connection |
| `webrtc:offer`         | `{ to, offer, sessionId }`         | Send WebRTC offer to peer        |
| `webrtc:answer`        | `{ to, answer }`                   | Respond with WebRTC answer       |
| `webrtc:ice-candidate` | `{ to, candidate }`                | Exchange ICE candidates          |
| `stream:started`       | `{ sessionId, type }`              | Notify stream is active          |

### Server → Client:

| Event                         | Data                                 | Purpose                   |
| ----------------------------- | ------------------------------------ | ------------------------- |
| `student:stream:ready`        | `{ sessionId, studentId, socketId }` | Phone camera ready        |
| `webrtc:offer`                | `{ from, offer, sessionId }`         | Receive connection offer  |
| `webrtc:answer`               | `{ from, answer }`                   | Receive connection answer |
| `webrtc:ice-candidate`        | `{ from, candidate }`                | Receive ICE candidate     |
| `stream:update`               | `{ sessionId, type, active }`        | Stream status changed     |
| `student:stream:disconnected` | `{ sessionId, socketId }`            | Phone camera disconnected |

## 🔒 Security Features

- ✅ Session ID validation
- ✅ WebSocket authentication for proctors
- ✅ Secure WebRTC connections (DTLS-SRTP)
- ✅ Camera permissions required
- ✅ HTTPS recommended for production
- ✅ No audio recording (privacy)

## 📱 Mobile Compatibility

### Tested Browsers:

- ✅ Chrome (Android/iOS)
- ✅ Safari (iOS)
- ✅ Firefox (Android)
- ✅ Samsung Internet

### Requirements:

- Camera access permission
- Stable internet connection
- Modern browser with WebRTC support
- HTTPS connection (required by browsers)

## 🚀 Testing Instructions

### Test Phone Camera Connection:

1. **Start the server**:

   ```bash
   npm run dev
   ```

2. **Login as student**:

   - Username: `Aasrith`
   - Password: `password`

3. **Start an exam**:

   - Navigate to an active/live exam
   - Exam session creates automatically
   - QR code appears in right sidebar

4. **Connect phone**:

   - Open phone camera or QR scanner app
   - Scan the displayed QR code
   - Browser will open to phone camera page
   - Allow camera access when prompted
   - Wait for "Connected" status

5. **Verify streaming**:

   - Student sees: Webcam feed + QR code card
   - Phone shows: "LIVE" badge on camera preview
   - Connection status: "Connected" (green badge)

6. **View as proctor**:
   - Login as proctor (username: `proctor`, password: `password`)
   - Navigate to Enhanced Live Monitor
   - Select exam with active students
   - See student camera feeds in grid
   - Both laptop and phone feeds visible

### Troubleshooting:

**QR Code doesn't appear**:

- Check browser console for errors
- Verify `/api/sessions/:id/qrcode` endpoint works
- Ensure `qrcode` package is installed

**Phone camera won't connect**:

- Check camera permissions are granted
- Verify WebSocket connection (check browser console)
- Ensure HTTPS for production (required by browsers)
- Check network/firewall settings

**No video in proctor dashboard**:

- Verify WebRTC peer connection established
- Check STUN server accessibility
- Inspect browser console for ICE candidate errors
- Ensure both devices on same network or proper NAT traversal

## 🎯 Next Steps (Optional Enhancements)

1. **Multi-peer Support**: Allow multiple proctors to view simultaneously
2. **Recording**: Save video streams for later review
3. **Bandwidth Optimization**: Adaptive bitrate based on connection quality
4. **Turn Server**: Add TURN server for better NAT traversal
5. **Mobile App**: Native mobile app for better camera control
6. **Picture-in-Picture**: Allow proctor to focus on specific students
7. **Snapshots**: Auto-capture snapshots during exam
8. **Connection Quality Indicator**: Show network quality metrics

## 📊 Performance Considerations

- **WebRTC**: Peer-to-peer connection reduces server load
- **Video Resolution**: 720p for phone, 480p for laptop (balanced quality/bandwidth)
- **No Audio**: Reduces bandwidth usage
- **Room-based Sockets**: Efficient message routing
- **Auto-cleanup**: Prevents memory leaks on disconnect

## 🐛 Known Issues

- None currently - feature is stable and tested

## 📚 Dependencies

- **Server**: `qrcode` (^1.5.4)
- **Client**: Native WebRTC APIs (built-in)
- **Socket.io**: Real-time communication
- **React**: UI components

---

**Last Updated**: December 14, 2025
**Version**: 2.1.0 (Phone Camera Feature)
**Status**: ✅ Production Ready
