
// Import required modules
import express from "express";
import 'dotenv/config';


// Initialize Express app
const app = express();
const port = 3000;


// Serve static files (frontend)
app.use(express.static('.'));


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
            }),
        });
        const data = await r.json();
        if (!r.ok) {
            // If OpenAI returns an error, send a 500 response to the client
            throw new Error(`OpenAI API Error: ${JSON.stringify(data)}`);
        }
        res.send(data);
    } catch (error) {
        // Log error and send generic error message to client
        res.status(500).send({ error: "Failed to create session." });
    }
});


// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
