const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("fileInput");
const convertBtn = document.getElementById("convertBtn");
const popup = document.getElementById("popup");
const popupMessage = document.getElementById("popupMessage");

let selectedFile = null;

if (dropArea && fileInput && convertBtn) {

    dropArea.addEventListener("click", () => {
        fileInput.click();
    });

    fileInput.addEventListener("change", () => {
        if (fileInput.files.length > 0) {
            handleFile(fileInput.files[0]);
        }
    });

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

    function handleFile(file) {

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

        dropArea.querySelector("p").textContent =
            `✅ ${file.name}`;
    }

    convertBtn.addEventListener("click", async () => {

        if (!selectedFile) return;

        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF();

        if (selectedFile.type.startsWith("text/")) {

            const text = await selectedFile.text();

            const lines = pdf.splitTextToSize(text, 180);

            pdf.text(lines, 10, 10);

            pdf.save(
                selectedFile.name.replace(/\.[^/.]+$/, "") + ".pdf"
            );

            showPopup("✅ PDF created successfully!");

            clearDropArea();
        }

        else if (selectedFile.type.startsWith("image/")) {

            const reader = new FileReader();

            reader.onload = function (e) {

                const img = new Image();

                img.onload = function () {

                    const pageWidth =
                        pdf.internal.pageSize.getWidth();

                    const pageHeight =
                        pdf.internal.pageSize.getHeight();

                    const ratio = Math.min(
                        pageWidth / img.width,
                        pageHeight / img.height
                    );

                    const width = img.width * ratio;

                    const height = img.height * ratio;

                    const x = (pageWidth - width) / 2;

                    const y = (pageHeight - height) / 2;

                    const format =
                        selectedFile.type.includes("png")
                            ? "PNG"
                            : "JPEG";

                    pdf.addImage(
                        e.target.result,
                        format,
                        x,
                        y,
                        width,
                        height
                    );

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

        else {

            const lines = [
                `File Name: ${selectedFile.name}`,
                `File Type: ${selectedFile.type || "Unknown"}`,
                "",
                "This file type cannot be fully converted in the browser.",
                "A placeholder PDF has been created instead."
            ];

            pdf.text(lines, 10, 10);

            pdf.save(
                selectedFile.name.replace(/\.[^/.]+$/, "") + ".pdf"
            );

            showPopup("✅ PDF created successfully!");

            clearDropArea();
        }
    });

    function clearDropArea() {

        selectedFile = null;

        fileInput.value = "";

        convertBtn.disabled = true;

        dropArea.querySelector("p").textContent =
            "📂 Drop Your File Here";
    }

    function showPopup(message) {

        popupMessage.textContent = message;

        popup.classList.remove("hidden");
    }

    window.closePopup = function () {
        popup.classList.add("hidden");
    };
}

const cursor = document.querySelector(".cursor");

document.addEventListener("mousemove", (e) => {

    if (cursor) {

        cursor.style.left = e.clientX + "px";

        cursor.style.top = e.clientY + "px";
    }

});
