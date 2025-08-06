// OpenAI Realtime API with WebRTC


// Main class for managing the realtime audio chat UI and WebRTC logic
class RealtimeAudioChat {
    constructor() {
        this.peerConnection = null;
        this.dataChannel = null;
        this.audioStream = null;
        this.remoteAudio = new Audio();
        this.remoteAudio.autoplay = true;
        this.initializeElements();
        this.setupEventListeners();
    }

    // Cache references to important DOM elements
    initializeElements() {
        this.startBtn = document.getElementById('start-chat-btn');
        this.stopBtn = document.getElementById('stop-chat-btn');
        this.connectionStatus = document.getElementById('connection-status');
        this.messagesContainer = document.getElementById('messages');
    }

    // Set up button click event listeners
    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startChat());
        this.stopBtn.addEventListener('click', () => this.stopChat());
    }

    /**
     * Starts a new chat session: gets an ephemeral key, sets up audio, WebRTC, and data channel.
     */
    async startChat() {
        this.updateStatus('connecting', 'Connecting...');
        this.startBtn.disabled = true;
        try {
            // Step 1: Get ephemeral key from our server
            const tokenResponse = await fetch("/session");
            if (!tokenResponse.ok) {
                const errorText = await tokenResponse.text();
                throw new Error(`Failed to get session token: ${tokenResponse.status} ${errorText}`);
            }
            const data = await tokenResponse.json();
            const EPHEMERAL_KEY = data.client_secret.value;
            if (!EPHEMERAL_KEY) {
                throw new Error("Ephemeral key not found in server response.");
            }
            // Step 2: Get microphone access
            this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Step 3: Create RTCPeerConnection
            this.peerConnection = new RTCPeerConnection();
            // Handle incoming audio from OpenAI
            this.peerConnection.ontrack = (event) => {
                if (event.streams && event.streams[0]) {
                    this.remoteAudio.srcObject = event.streams[0];
                }
            };
            // Add microphone track to send audio to OpenAI
            this.audioStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.audioStream);
            });
            // Step 4: Create Data Channel for events
            this.dataChannel = this.peerConnection.createDataChannel("oai-events");
            this.dataChannel.onmessage = (event) => this.handleRealtimeMessage(JSON.parse(event.data));
            this.dataChannel.onopen = () => {
                this.updateStatus('connected', 'Connected');
                this.stopBtn.disabled = false;
                this.addMessage('system', 'Connected! Ask me about Indian tourism.');
                this.configureSession();
            };
            // Step 5: Create and send SDP offer
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            const sdpResponse = await fetch(`https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2025-06-03`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${EPHEMERAL_KEY}`,
                    'Content-Type': 'application/sdp'
                },
                body: offer.sdp
            });
            if (!sdpResponse.ok) {
                const errorText = await sdpResponse.text();
                throw new Error(`Failed to get SDP answer: ${sdpResponse.status} ${errorText}`);
            }
            const answer = {
                type: "answer",
                sdp: await sdpResponse.text(),
            };
            await this.peerConnection.setRemoteDescription(answer);
        } catch (error) {
            // Show error in UI and reset state
            this.addMessage('system', `Failed to start chat: ${error.message}`);
            this.updateStatus('disconnected', 'Connection failed');
            this.startBtn.disabled = false;
        }
    }

    /**
     * Stops the current chat session and cleans up all resources.
     */
    stopChat() {
        if (this.dataChannel) {
            this.dataChannel.close();
            this.dataChannel = null;
        }
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
            this.audioStream = null;
        }
        this.remoteAudio.srcObject = null;
        this.updateStatus('disconnected', 'Disconnected');
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.addMessage('system', 'Chat ended.');
    }

    /**
     * Sends session configuration instructions to the assistant via the data channel.
     */
    configureSession() {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            const event = {
                type: "session.update",
                session: {
                    instructions: "You are an expert on Indian tourism. Only answer questions about Indian tourism. For any other questions, respond with 'I can only answer questions about Indian tourism.'",
                    voice: "verse"
                },
            };
            this.dataChannel.send(JSON.stringify(event));
        }
    }

    /**
     * Handles messages received from the assistant via the data channel.
     * Updates the UI based on the message type.
     */
    handleRealtimeMessage(message) {
        console.log("Received message:", message);
        switch (message.type) {
            case 'session.updated':
                // Session configuration acknowledged
                break;
            case 'conversation.item.input_audio_transcription.completed':
                if (message.transcript) {
                    console.log("User said:", message.transcript);
                    this.addMessage('user', message.transcript);
                    this.extractKeywords(message.transcript);
                }
                break;
            case 'input_audio_buffer.speech_started':
                this.addMessage('system', 'Listening...');
                break;
            case 'input_audio_buffer.speech_stopped':
                this.addMessage('system', 'Processing...');
                break;
            case 'response.audio_transcript.done':
                if (message.transcript) {
                    this.addMessage('assistant', message.transcript);
                }
                break;
            case 'error':
                this.addMessage('system', `Error: ${message.error.message || JSON.stringify(message.error)}`);
                break;
            // Add other event handlers as needed, keeping it minimal for now
        }
    }

    async extractKeywords(text) {
        try {
            const response = await fetch('/keywords', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to get keywords: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            if (data.keywords) {
                this.addMessage('system', `Keywords: ${data.keywords}`);
            }
        } catch (error) {
            this.addMessage('system', `Error extracting keywords: ${error.message}`);
        }
    }

    // Updates the connection status display in the UI
    updateStatus(status, text) {
        this.connectionStatus.className = `status ${status}`;
        this.connectionStatus.querySelector('.status-text').textContent = text;
    }

    // Adds a message to the chat log in the UI
    addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = content;
        this.messagesContainer.appendChild(messageDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

// Initialize the chat UI when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.realtimeChat = new RealtimeAudioChat();
});
