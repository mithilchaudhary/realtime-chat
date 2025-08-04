import express from "express";
import 'dotenv/config';

const app = express();
const port = 3000;

app.use(express.static('.'));


/**
 * GET /session
 * Creates a new ephemeral session with OpenAI's Realtime API and returns the session data to the client.
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
            throw new Error(`OpenAI API Error: ${JSON.stringify(data)}`);
        }
        res.send(data);
    } catch (error) {
        res.status(500).send({ error: "Failed to create session." });
    }
});


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
