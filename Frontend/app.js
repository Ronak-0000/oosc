// Replace this with the URL of your Render Web Service (Backend)
const BACKEND_API_URL = "https://caseloop1.onrender.com/simplify";

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
        const response = await fetch(BACKEND_API_URL, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const data = await response.json();
        statusText.innerText = "Success! Generated Points:";
        
        // Display the results as bullet points
        data.simplified_points.forEach(point => {
            const li = document.createElement("li");
            li.textContent = point;
            resultsList.appendChild(li);
        });

    } catch (error) {
        console.error("Connection failed:", error);
        statusText.innerText = "Failed to connect to backend: " + error.message;
    } finally {
        submitBtn.disabled = false;
    }
});
