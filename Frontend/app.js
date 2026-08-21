// Ensure this matches your Render Web Service URL
const BACKEND_BASE_URL = "https://caseloop.onrender.com";

// --- Feature 1: PDF Simplifier Logic ---
const submitBtn = document.getElementById("submitBtn");
const statusText = document.getElementById("statusText");
const resultsList = document.getElementById("resultsList");

submitBtn.addEventListener("click", async () => {
    const fileInput = document.getElementById("pdfInput").files[0];
    
    if (!fileInput) {
        statusText.innerText = "Error: Please select a PDF file first.";
        return;
    }

    const formData = new FormData();
    formData.append("file", fileInput);

    statusText.innerText = "Sending to Render Backend (Please wait)...";
    resultsList.innerHTML = "";
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/simplify`, {
            method: "POST",
            body: formData
        });

        const rawText = await response.text();
        console.log("Server HTTP Status:", response.status);
        console.log("Raw Server Response:", rawText);

        if (!response.ok) {
            throw new Error(`Server returned HTTP ${response.status}: ${rawText.slice(0, 200)}`);
        }

        const data = JSON.parse(rawText);
        statusText.innerText = "Success! Generated Points:";
        
        if (data.simplified_points && Array.isArray(data.simplified_points)) {
            data.simplified_points.forEach(point => {
                const li = document.createElement("li");
                li.textContent = point;
                resultsList.appendChild(li);
            });
        } else {
            statusText.innerText = "Received response, but no points found.";
        }

    } catch (error) {
        console.error("Connection failed:", error);
        statusText.innerText = "Error: " + error.message;
    } finally {
        submitBtn.disabled = false;
    }
});

// --- Feature 2: RTI Drafter Logic ---
const draftBtn = document.getElementById("draftBtn");
const promptInput = document.getElementById("promptInput");
const draftStatusText = document.getElementById("draftStatusText");
const draftResultContainer = document.getElementById("draftResultContainer");
const draftResult = document.getElementById("draftResult");

draftBtn.addEventListener("click", async () => {
    const prompt = promptInput.value.trim();

    if (!prompt) {
        draftStatusText.innerText = "Error: Please enter a query or problem description.";
        return;
    }

    draftStatusText.innerText = "Generating RTI draft (Please wait)...";
    draftResultContainer.style.display = "none";
    draftResult.textContent = "";
    draftBtn.disabled = true;

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/draft`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ prompt: prompt })
        });

        const rawText = await response.text();
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${rawText.slice(0, 200)}`);
        }

        const data = JSON.parse(rawText);
        draftStatusText.innerText = "Draft generated successfully!";
        draftResult.textContent = data.draft;
        draftResultContainer.style.display = "block";

    } catch (error) {
        console.error("Drafter error:", error);
        draftStatusText.innerText = "Error: " + error.message;
    } finally {
        draftBtn.disabled = false;
    }
});
