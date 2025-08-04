# Realtime Audio Chat with OpenAI

This project is a web application that enables real-time audio chat with an AI assistant using OpenAI's Realtime API and WebRTC. The assistant is configured to answer only questions about Indian tourism.

[Watch the demo here!](https://drive.google.com/file/d/1fEM3bHZZaBkD5wYZ-gU02oQqjtyinGgt/view?usp=drive_link)


## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express
- **APIs:** OpenAI Realtime API, WebRTC for audio streaming

## Prerequisites
- [Node.js](https://nodejs.org/) (includes npm) installed on your system (Windows or macOS).
- An OpenAI API key with access to the Realtime API.

## Setup Instructions

1. **Clone or download the repository**
   ```bash
   git clone <repository-url>
   cd realtime-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Create a `.env` file in the project root:
     ```bash
     touch .env
     ```
   - Add your OpenAI API key to `.env`:
     ```
     OPENAI_API_KEY=your_openai_api_key_here
     ```

## Running the Application

1. **Start the server**
   ```bash
   npm start
   ```
   The server will run at `http://localhost:3000` by default.

2. **Open the app in your browser**
   - Go to `http://localhost:3000`.


## Notes
- The assistant will only answer questions about Indian tourism. For other topics, it will respond with a generic message.
- All sensitive keys are kept on the server and never exposed to the client.
- For more details, see the [OpenAI Realtime API documentation](https://platform.openai.com/docs/guides/realtime).

---

**Developed for RocketLearn.AI**
