// Global variables that need to be accessed by multiple functions
let questions = [];
let currentIndex = 0;
let answers = [];
let recognition;
let postureData = { spineAngle: "Not Detected", eyeContact: "Not Detected" };
let cameraEnabled = sessionStorage.getItem("camera") === "true";

navigator.mediaDevices.getUserMedia({ video: cameraEnabled, audio: true });
if (cameraEnabled) {
     startCamera(); // <-- Make this await to ensure PoseNet initializes
}

// All setup logic now correctly resides inside window.onload
window.onload = async () => {
    const loader = document.getElementById("loader");
    const loaderText = document.getElementById("loader-text");

    loader.style.display = 'flex';
    loaderText.textContent = 'Warming up the AI interviewer...';

    // Get session data here, where it's needed.
    const domain = sessionStorage.getItem("domain");
    const difficulty = sessionStorage.getItem("level");
    const cameraEnabled = sessionStorage.getItem("camera") === "true";

    if (!domain || !difficulty) {
        loaderText.textContent = 'Error: No domain or difficulty set. Please start again from the home page.';
        return;
    }

    try {
        // Request media permissions
        await navigator.mediaDevices.getUserMedia({ video: cameraEnabled, audio: true });

        // Fetch questions from the backend
        loaderText.textContent = 'Generating your questions...';
        const res = await fetch('/api/generate-questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domain, difficulty })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || `Server responded with status: ${res.status}`);
        }

        const data = await res.json();
        if (!data.questions || data.questions.length === 0) {
            throw new Error("The AI failed to generate questions. Please try again.");
        }

        // --- Success Path ---
        questions = data.questions;
        if (cameraEnabled) {
            startCamera();
        }
        startInterview();

    } catch (error) {
        console.error("Initialization Failed:", error);
        loaderText.innerHTML = `<strong>Initialization Failed:</strong><br>${error.message}<br><br>Please ensure your server is running and the .env file is correct.`;
        return;
    } finally {
        // Only hide the loader if the interview successfully starts
        if (questions.length > 0) {
            loader.style.display = 'none';
        }
    }
};

document.getElementById("posture-status").textContent = "Posture: Awaiting Analysis";
document.getElementById("eye-contact-status").textContent = "Eye Contact: Awaiting Analysis";

function startInterview() {
    document.getElementById("interview-container").style.display = 'block';
    displayQuestion();
    startSpeechRecognition();
}

function displayQuestion() {
    document.getElementById("question-text").textContent = questions[currentIndex];
    document.getElementById("question-counter").textContent = `Question ${currentIndex + 1} of ${questions.length}`;
    document.getElementById("typed-answer").value = "";
    speakQuestion(questions[currentIndex]);
}

function speakQuestion(text) {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

document.getElementById("next-question").addEventListener("click", () => {
    if (recognition) recognition.stop();
    answers.push({ question: questions[currentIndex], response: document.getElementById("typed-answer").value.trim() || "No answer provided." });
    currentIndex++;
    if (currentIndex < questions.length) {
        displayQuestion();
        if (currentIndex === questions.length - 1) document.getElementById("next-question").textContent = "Finish & Evaluate";
    } else {
        evaluateInterview();
    }
});

async function evaluateInterview() {
    document.getElementById("interview-container").style.display = "none";
    const loader = document.getElementById("loader");
    loader.style.display = "flex";
    document.getElementById("loader-text").textContent = 'Evaluating your answers...';

    const domain = sessionStorage.getItem("domain"); // Get domain again for this request
    const difficulty = sessionStorage.getItem("level");

    try {
        const res = await fetch('/api/evaluate-responses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers, posture: postureData, domain })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Evaluation failed.");
        
        displayEvaluation(data.evaluation);
        
        await fetch('/api/save-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ evaluation: data.evaluation, domain, difficulty })
        });
        
        document.getElementById("evaluation-section").style.display = "block";
    } catch (error) {
    console.error("Initialization Failed:", error);
    loaderText.innerHTML = `<strong>Initialization Failed:</strong><br>${error.message}<br><br>Please ensure your server is running and the .env file is correct.`;
}
 finally {
        loader.style.display = "none";
    }
}

function displayEvaluation(evaluation) {
    document.getElementById("overall-proficiency").textContent = evaluation.overall_proficiency || 'N/A';
    document.getElementById("overall-feedback").textContent = evaluation.feedback || 'N/A';
    const tbody = document.querySelector("#feedback-table tbody");
    tbody.innerHTML = "";
    evaluation.results.forEach(result => {
        tbody.innerHTML += `<tr>
            <td>${result.question || 'N/A'}</td>
            <td>${result.score || 'N/A'}/10</td>
            <td>${result.improvement || 'N/A'}</td>
        </tr>`;
    });
}
