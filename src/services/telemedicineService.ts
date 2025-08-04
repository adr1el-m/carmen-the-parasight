import { auth } from '../config/firebase';

interface TelemedicineSession {
  id: string;
  patientId: string;
  providerId: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  roomId: string;
  recordingUrl?: string;
  notes?: string;
}

interface VideoCallConfig {
  iceServers: RTCIceServer[];
  mediaConstraints: MediaStreamConstraints;
  signalingServer: string;
}

class TelemedicineService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private signalingChannel: WebSocket | null = null;
  
  private readonly config: VideoCallConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ],
    mediaConstraints: {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    },
    signalingServer: import.meta.env.VITE_SIGNALING_SERVER || 'wss://your-signaling-server.com'
  };

  async initializeCall(sessionId: string): Promise<MediaStream> {
    try {
      // Initialize WebRTC peer connection
      this.peerConnection = new RTCPeerConnection({
        iceServers: this.config.iceServers
      });

      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia(
        this.config.mediaConstraints
      );

      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection) {
          this.peerConnection.addTrack(track, this.localStream!);
        }
      });

      // Handle remote stream
      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0];
      };

      // Connect to signaling server
      await this.connectSignalingServer(sessionId);

      return this.localStream;
    } catch (error) {
      console.error('Failed to initialize call:', error);
      throw new Error('Failed to start video consultation');
    }
  }

  private async connectSignalingServer(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.signalingChannel = new WebSocket(this.config.signalingServer);
      
      this.signalingChannel.onopen = () => {
        this.signalingChannel?.send(JSON.stringify({
          type: 'join',
          sessionId,
          userId: auth.currentUser?.uid
        }));
        resolve();
      };

      this.signalingChannel.onerror = (error) => {
        reject(error);
      };

      this.signalingChannel.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        await this.handleSignalingMessage(message);
      };
    });
  }

  private async handleSignalingMessage(message: any): Promise<void> {
    if (!this.peerConnection) return;

    switch (message.type) {
      case 'offer':
        await this.peerConnection.setRemoteDescription(message.offer);
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        this.signalingChannel?.send(JSON.stringify({
          type: 'answer',
          answer
        }));
        break;

      case 'answer':
        await this.peerConnection.setRemoteDescription(message.answer);
        break;

      case 'ice-candidate':
        await this.peerConnection.addIceCandidate(message.candidate);
        break;
    }
  }

  async endCall(): Promise<void> {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    
    if (this.signalingChannel) {
      this.signalingChannel.close();
    }

    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.signalingChannel = null;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  async toggleVideo(): Promise<void> {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  }

  async toggleAudio(): Promise<void> {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }

  async shareScreen(): Promise<MediaStream | null> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      const videoTrack = screenStream.getVideoTracks()[0];
      if (this.peerConnection) {
        const sender = this.peerConnection.getSenders().find(s => 
          s.track?.kind === 'video'
        );
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      }

      return screenStream;
    } catch (error) {
      console.error('Failed to share screen:', error);
      return null;
    }
  }
}

export default new TelemedicineService(); 