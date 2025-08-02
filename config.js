// Configuration for OpenAI Realtime API
const CONFIG = {
    // Replace with your actual OpenAI API key
    OPENAI_API_KEY: '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',
    
    // OpenAI Realtime API WebSocket URL
    REALTIME_API_URL: 'wss://api.openai.com/v1/realtime',
    
    // Audio configuration
    AUDIO_CONFIG: {
        sampleRate: 24000,
        channels: 1,
        format: 'pcm16'
    },
    
    // System prompt for Indian tourism focus (Part 2)
    SYSTEM_PROMPT: `You are an AI assistant specialized in Indian tourism. You should only respond to questions related to:
    - Tourist destinations in India
    - Indian culture and heritage sites
    - Travel tips for visiting India
    - Indian festivals and traditions
    - Food and cuisine of India
    - Transportation in India
    - Accommodation in India
    - Historical monuments and landmarks in India
    
    For any questions that are NOT related to Indian tourism, respond with exactly this message: "I can not reply to this question. I'm here to help you with questions about Indian tourism only."
    
    Keep your responses conversational and helpful for tourists planning to visit India.`,
    
    // Voice settings
    VOICE_SETTINGS: {
        voice: 'alloy', // Options: alloy, echo, fable, onyx, nova, shimmer
        modalities: ['text', 'audio'],
        instructions: 'You are a helpful assistant focused on Indian tourism.'
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
