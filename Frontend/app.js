// Replace with your actual Render backend URL once deployed
const BACKEND_API_URL = "https://your-render-backend-url.onrender.com/api/simplify";

async function sendToBackend(pdfFile) {
    const formData = new FormData();
    formData.append("file", pdfFile);

    try {
        const response = await fetch(BACKEND_API_URL, {
            method: "POST",
            body: formData
        });

        if (!response.ok) throw new Error("Backend processing failed");

        const data = await response.json();
        console.log("Simplified Points:", data.simplified_points);
        
        // Add code here to display data.simplified_points in your UI
        
    } catch (error) {
        console.error("Error connecting to backend:", error);
    }
}
