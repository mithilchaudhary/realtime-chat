// OpenAI Realtime API with WebRTC

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

    initializeElements() {
        this.startBtn = document.getElementById('start-chat-btn');
        this.stopBtn = document.getElementById('stop-chat-btn');
        this.connectionStatus = document.getElementById('connection-status');
        this.messagesContainer = document.getElementById('messages');
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startChat());
        this.stopBtn.addEventListener('click', () => this.stopChat());
    }

    async startChat() {
        if (!CONFIG.OPENAI_API_KEY || CONFIG.OPENAI_API_KEY === 'your-openai-api-key-here') {
            this.addMessage('system', 'Please set your OpenAI API key in config.js');
            return;
        }

        this.updateStatus('connecting', 'Connecting...');
        this.startBtn.disabled = true;

        try {
            // 1. Get microphone access
            this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // 2. Create RTCPeerConnection
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

            // 3. Create Data Channel for events
            this.dataChannel = this.peerConnection.createDataChannel("oai-events");
            this.dataChannel.onmessage = (event) => this.handleRealtimeMessage(JSON.parse(event.data));
            this.dataChannel.onopen = () => {
                this.updateStatus('connected', 'Connected');
                this.stopBtn.disabled = false;
                this.addMessage('system', 'Connected! Ask me about Indian tourism.');
                this.configureSession();
            };

            // 4. Create and send SDP offer
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);

            const sdpResponse = await fetch(`https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2025-06-03`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`,
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
            console.error('Error starting chat:', error);
            this.addMessage('system', `Failed to start chat: ${error.message}`);
            this.updateStatus('disconnected', 'Connection failed');
            this.startBtn.disabled = false;
        }
    }

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

    configureSession() {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            const event = {
                type: "session.update",
                session: {
                    instructions: "You are an expert on Indian tourism. Only answer questions about Indian tourism. For any other questions, respond with 'I can only answer questions about Indian tourism.'",
                    voice: "verse" // Example voice
                },
            };
            this.dataChannel.send(JSON.stringify(event));
        }
    }

    handleRealtimeMessage(message) {
        console.log('Received message:', message.type, message); // Added for debugging

        switch (message.type) {
            case 'session.updated':
                console.log('Session configured.');
                break;
            case 'input_audio_buffer.speech_started':
                this.addMessage('system', 'Listening...');
                break;
            case 'input_audio_buffer.speech_stopped':
                this.addMessage('system', 'Processing...');
                break;
            case 'response.audio_transcript.done':
                if (message.transcript) {
                    this.addMessage('user', message.transcript);
                }
                break;
            case 'response.done':
                if (message.response && message.response.output && message.response.output[0] && message.response.output[0].text) {
                    this.addMessage('assistant', message.response.output[0].text);
                }
                break;
            case 'error':
                console.error('API Error:', message.error);
                this.addMessage('system', `Error: ${message.error.message || JSON.stringify(message.error)}`);
                break;
            // Add other event handlers as needed, keeping it minimal for now
        }
    }

    updateStatus(status, text) {
        this.connectionStatus.className = `status ${status}`;
        this.connectionStatus.querySelector('.status-text').textContent = text;
    }

    addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = content;
        this.messagesContainer.appendChild(messageDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.realtimeChat = new RealtimeAudioChat();
});
