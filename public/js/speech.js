// This file handles all browser speech synthesis and recognition.

/**
 * Uses the browser's speech synthesis to read text aloud.
 * @param {string} text The text to be spoken.
 */
function speakQuestion(text) {
    window.speechSynthesis.cancel(); // Cancel any previous speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
}

/**
 * Starts the speech recognition process to capture the user's answer.
 * @returns {SpeechRecognition} The recognition instance.
 */
function startSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.warn("Speech recognition not supported in this browser.");
        return null;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    let finalTranscript = '';

    recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript + ' ';
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        document.getElementById("typed-answer").value = finalTranscript + interimTranscript;
    };
    
    recognition.start();
    return recognition;
}
