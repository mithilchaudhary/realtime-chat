// Import required modules
import express from "express";
import 'dotenv/config';


// Initialize Express app
const app = express();
const port = 3000;


// Serve static files (frontend)
app.use(express.static('.'));
app.use(express.json());


/**
 * GET /session
 * Creates a new ephemeral session with OpenAI's Realtime API and returns the session data to the client.
 * The API key is kept secure on the server.
 */
app.get("/session", async (req, res) => {
    try {
        const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-realtime-preview-2025-06-03",
                voice: "verse",
                input_audio_transcription: {
                    model: "whisper-1",
                    language: "en",
                },
            }),
        });
        const data = await r.json();
        console.log("Session created:", data);
        if (!r.ok) {
            // If OpenAI returns an error, send a 500 response to the client
            throw new Error(`OpenAI API Error: ${JSON.stringify(data)}`);
        }
        res.send(data);
    } catch (error) {
        // Log error and send generic error message to client
        console.error("Error creating session:", error);
        res.status(500).send({ error: "Failed to create session." });
    }
});


app.post("/keywords", async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).send({ error: "Text is required." });
        }

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert in keyword extraction. Extract the most important keywords from the following input text. Return them as a comma-separated list. The keywords should only come from the input text and should not include any additional information or context."
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
                max_tokens: 60,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(`OpenAI API Error: ${JSON.stringify(data)}`);
        }

        const keywords = data.choices[0].message.content;
        res.send({ keywords });

    } catch (error) {
        console.error("Error extracting keywords:", error);
        res.status(500).send({ error: "Failed to extract keywords." });
    }
});


// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
