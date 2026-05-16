const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("fileInput");
const convertBtn = document.getElementById("convertBtn");
const popup = document.getElementById("popup");
const popupMessage = document.getElementById("popupMessage");

let selectedFile = null;

// Click to select file
dropArea.addEventListener("click", () => {
    fileInput.click();
});

// File selected manually
fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
        handleFile(fileInput.files[0]);
    }
});

// Drag events
dropArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropArea.classList.add("dragover");
});

dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("dragover");
});

dropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    dropArea.classList.remove("dragover");

    if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

// Handle file
function handleFile(file) {
    // Reject PDF files
    if (
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
    ) {
        clearDropArea();
        showPopup("❌ Invalid file! PDF files are not allowed.");
        return;
    }

    selectedFile = file;
    convertBtn.disabled = false;
    dropArea.querySelector("p").textContent = `✅ ${file.name}`;
}

// Convert to PDF
convertBtn.addEventListener("click", async () => {
    if (!selectedFile) return;

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    // Text files
    if (selectedFile.type.startsWith("text/")) {
        const text = await selectedFile.text();
        const lines = pdf.splitTextToSize(text, 180);
        pdf.text(lines, 10, 10);
        pdf.save(selectedFile.name.replace(/\.[^/.]+$/, "") + ".pdf");

        showPopup("✅ PDF created successfully!");
        clearDropArea();
    }

    // Image files
    else if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const img = new Image();

            img.onload = function () {
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();

                const ratio = Math.min(
                    pageWidth / img.width,
                    pageHeight / img.height
                );

                const width = img.width * ratio;
                const height = img.height * ratio;

                const x = (pageWidth - width) / 2;
                const y = (pageHeight - height) / 2;

                // Detect image format automatically
                const format = selectedFile.type.includes("png")
                    ? "PNG"
                    : "JPEG";

                pdf.addImage(e.target.result, format, x, y, width, height);
                pdf.save(
                    selectedFile.name.replace(/\.[^/.]+$/, "") + ".pdf"
                );

                showPopup("✅ PDF created successfully!");
                clearDropArea();
            };

            img.src = e.target.result;
        };

        reader.readAsDataURL(selectedFile);
    }

    // Other files
    else {
        const lines = [
            `File Name: ${selectedFile.name}`,
            `File Type: ${selectedFile.type || "Unknown"}`,
            "",
            "This file type cannot be fully converted in the browser.",
            "A placeholder PDF has been created instead."
        ];

        pdf.text(lines, 10, 10);
        pdf.save(selectedFile.name.replace(/\.[^/.]+$/, "") + ".pdf");

        showPopup("✅ PDF created successfully!");
        clearDropArea();
    }
});

// Clear drop area after conversion
function clearDropArea() {
    selectedFile = null;
    fileInput.value = "";
    convertBtn.disabled = true;
    dropArea.querySelector("p").textContent = "📂 Drop Your File Here";
}

// Popup functions
function showPopup(message) {
    popupMessage.textContent = message;
    popup.classList.remove("hidden");
}

function closePopup() {
    popup.classList.add("hidden");
}