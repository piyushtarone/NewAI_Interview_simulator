require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Serve static files from "public"
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Initialize Google Gemini
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

const hrQuestions = [
    "Tell me about yourself.",
    "Why should we hire you?",
    "What are your strengths and weaknesses?",
    "Where do you see yourself in 5 years?",
    "Why are you interested in this company?",
    "Describe a challenging situation you faced at work.",
    "What motivates you to do your best work?",
    "How do you handle stress and pressure?"
];

// Function to generate interview questions
async function generateQuestionsWithRetry(prompt, retries = 3) {
    const models = ["gemini-1.5-flash", "gemini-1.5-pro"];
    let lastError = null;

    for (const modelName of models) {
        const model = genAI.getGenerativeModel({ model: modelName });
        for (let i = 0; i < retries; i++) {
            try {
                const result = await model.generateContent(prompt);
                return result.response.text();
            } catch (err) {
                lastError = err;
                if (err.status === 503 && i < retries - 1) {
                    await new Promise(r => setTimeout(r, (i + 1) * 1000));
                } else {
                    break;
                }
            }
        }
    }
    throw new Error(`All models failed. Last error: ${lastError.message}`);
}

// ✅ API ROUTES

// Generate Questions
app.post('/api/generate-questions', async (req, res) => {
    const { domain, difficulty } = req.body;
    if (!domain) return res.status(400).json({ error: 'Job domain is required.' });

    const selectedHR = hrQuestions.sort(() => 0.5 - Math.random()).slice(0, 2);
    const prompt = `Generate 5 technical interview questions for a ${domain} role at a ${difficulty} level. Each under 12 words. Format as a numbered list.`;

    try {
        const text = await generateQuestionsWithRetry(prompt);
        const techQuestions = text.split('\n')
            .map(q => q.trim())
            .filter(q => /^[1-5]\./.test(q))
            .map(q => q.replace(/^[1-5]\.\s*/, ''));

        if (techQuestions.length < 5) {
            return res.status(500).json({ error: 'Failed to generate enough questions.' });
        }

        const allQuestions = [...selectedHR, ...techQuestions].sort(() => 0.5 - Math.random());
        res.json({ questions: allQuestions });
    } catch (error) {
        console.error("Question generation failed:", error.message);
        res.status(500).json({ error: 'Error generating questions.' });
    }
});

// Evaluate Interview Responses
app.post('/api/evaluate-responses', async (req, res) => {
    const { answers, domain, posture } = req.body;
    if (!answers?.length) {
        return res.status(400).json({ error: 'Answers are required.' });
    }

    const evalPrompt = `
    You are an expert ${domain} role interviewer.
    Evaluate the following interview answers based on the provided questions.
    The candidate's observed posture was: ${posture.spineAngle}.

    You MUST return ONLY a single, valid JSON object and nothing else.
    The JSON object must have this exact structure:
    {
      "results": [{"question": "string", "score": "number", "improvement": "string"}],
      "overall_proficiency": "string",
      "feedback": "string"
    }

    Interview Data:
    ${answers.map((a, i) => `Question: ${a.question}\nAnswer: ${a.response}`).join('\n\n')}
    `;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(evalPrompt);
        let rawText = result.response.text();

        const startIndex = rawText.indexOf('{');
        const endIndex = rawText.lastIndexOf('}');
        if (startIndex === -1 || endIndex === -1) {
            console.error("No JSON found in response:", rawText);
            throw new Error("No JSON object found.");
        }

        const jsonString = rawText.substring(startIndex, endIndex + 1);
        const evaluationJson = JSON.parse(jsonString);
        res.json({ evaluation: evaluationJson });

    } catch (error) {
        console.error("Evaluation failed:", error.message);
        res.status(500).json({ error: 'Failed to parse evaluation from model.' });
    }
});

// ✅ Fallback Route (MUST BE LAST)
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
