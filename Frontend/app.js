// Ensure this matches your Render Web Service URL and endpoint path
const BACKEND_API_URL = "https://caseloopb.onrender.com/api/simplify";

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
