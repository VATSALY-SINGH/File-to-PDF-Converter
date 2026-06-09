(function initCursor() {
    const cursor = document.querySelector(".cursor");
    if (cursor) {
        let mouseX = -999;
        let mouseY = -999;
        let currentX = -999;
        let currentY = -999;

        window.addEventListener("mousemove", (e) => {
            mouseX = e.clientX - 175; // center the 350px width glow
            mouseY = e.clientY - 175; // center the 350px height glow
        });

        function updateCursor() {
            if (mouseX !== -999) {
                if (currentX === -999) {
                    currentX = mouseX;
                    currentY = mouseY;
                } else {
                    currentX += (mouseX - currentX) * 0.08; // Smooth trailing interpolation
                    currentY += (mouseY - currentY) * 0.08;
                }
                cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
            }
            requestAnimationFrame(updateCursor);
        }
        requestAnimationFrame(updateCursor);
    }
})();

const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("fileInput");
const convertBtn = document.getElementById("convertBtn");
const popup = document.getElementById("popup");
const popupMessage = document.getElementById("popupMessage");

if (dropArea && fileInput && convertBtn) {
    let selectedFile = null;
    let currentTool = "pdf";

    const toolConfigs = {
        pdf: {
            title: "Free PDF Builder",
            subtitle: "Convert Images & Files Into PDF Instantly",
            btnText: "Convert to PDF",
            accept: "*",
            validate: (file) => {
                if (
                    file.type === "application/pdf" ||
                    file.name.toLowerCase().endsWith(".pdf")
                ) {
                    return "❌ Invalid file! PDF files are not allowed.";
                }
                return null;
            }
        },
        "jpg-png": {
            title: "JPG to PNG Converter",
            subtitle: "Convert JPG/JPEG Images Into PNG Format Instantly",
            btnText: "Convert to PNG",
            accept: ".jpg,.jpeg,image/jpeg",
            validate: (file) => {
                const ext = file.name.toLowerCase();
                if (!(ext.endsWith(".jpg") || ext.endsWith(".jpeg") || file.type === "image/jpeg")) {
                    return "❌ Invalid file! Please select a JPG/JPEG image.";
                }
                return null;
            }
        },
        "png-jpg": {
            title: "PNG to JPG Converter",
            subtitle: "Convert PNG Images Into JPG Format Instantly",
            btnText: "Convert to JPG",
            accept: ".png,image/png",
            validate: (file) => {
                const ext = file.name.toLowerCase();
                if (!(ext.endsWith(".png") || file.type === "image/png")) {
                    return "❌ Invalid file! Please select a PNG image.";
                }
                return null;
            }
        }
    };

    function clearDropArea() {
        selectedFile = null;
        fileInput.value = "";
        convertBtn.disabled = true;
        dropArea.querySelector("p").textContent = "📂 Drop Your File Here";
    }

    function switchTool(toolId) {
        if (!toolConfigs[toolId]) return;
        currentTool = toolId;
        
        // Update hash in URL
        window.location.hash = toolId;
        
        const config = toolConfigs[toolId];
        
        // Update dropdown button label in header
        const dropdownBtn = document.getElementById("toolsDropdownBtn");
        if (dropdownBtn) {
            dropdownBtn.textContent = `Tool: ${config.title.split(" ")[0]} ▼`;
        }
        
        // Update Main Title & Subtitle & Button
        const glowText = document.querySelector(".glow-text");
        const subtitle = document.querySelector(".subtitle");
        if (glowText) glowText.textContent = config.title;
        if (subtitle) subtitle.textContent = config.subtitle;
        if (convertBtn) convertBtn.textContent = config.btnText;
        if (fileInput) fileInput.accept = config.accept;
        
        clearDropArea();
    }

    // Check URL hash on load
    function handleHashRoute() {
        const hash = window.location.hash.replace("#", "");
        if (hash && toolConfigs[hash]) {
            switchTool(hash);
        } else {
            switchTool("pdf");
        }
    }

    // Add event listeners for switching tools
    ["pdf", "jpg-png", "png-jpg"].forEach(toolId => {
        const link = document.getElementById(`tool-${toolId}`);
        if (link) {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                switchTool(toolId);
            });
        }
    });

    // Hash navigation listener
    window.addEventListener("hashchange", handleHashRoute);
    
    // Initial route check on load
    handleHashRoute();

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
        const config = toolConfigs[currentTool];
        const error = config.validate(file);
        if (error) {
            clearDropArea();
            showPopup(error);
            return;
        }

        selectedFile = file;
        convertBtn.disabled = false;
        dropArea.querySelector("p").textContent = `✅ ${file.name}`;
    }

    convertBtn.addEventListener("click", async () => {
        if (!selectedFile) return;

        if (currentTool === "pdf") {
            // PDF Conversion Logic
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();

            if (selectedFile.type.startsWith("text/")) {
                const text = await selectedFile.text();
                const lines = pdf.splitTextToSize(text, 180);
                pdf.text(lines, 10, 10);
                pdf.save(selectedFile.name.replace(/\.[^/.]+$/, "") + ".pdf");
                showPopup("✅ PDF created successfully!");
                clearDropArea();
            } else if (selectedFile.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const img = new Image();
                    img.onload = function () {
                        const pageWidth = pdf.internal.pageSize.getWidth();
                        const pageHeight = pdf.internal.pageSize.getHeight();
                        const ratio = Math.min(pageWidth / img.width, pageHeight / img.height);
                        const width = img.width * ratio;
                        const height = img.height * ratio;
                        const x = (pageWidth - width) / 2;
                        const y = (pageHeight - height) / 2;
                        const format = selectedFile.type.includes("png") ? "PNG" : "JPEG";
                        pdf.addImage(e.target.result, format, x, y, width, height);
                        pdf.save(selectedFile.name.replace(/\.[^/.]+$/, "") + ".pdf");
                        showPopup("✅ PDF created successfully!");
                        clearDropArea();
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(selectedFile);
            } else {
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
        } else if (currentTool === "jpg-png" || currentTool === "png-jpg") {
            // Image Conversion Logic (JPG to PNG or PNG to JPG)
            const reader = new FileReader();
            reader.onload = function (event) {
                const img = new Image();
                img.onload = function () {
                    const canvas = document.createElement("canvas");
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext("2d");

                    if (currentTool === "png-jpg") {
                        // Draw white background since JPEG doesn't support transparency
                        ctx.fillStyle = "#FFFFFF";
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }

                    ctx.drawImage(img, 0, 0);

                    const targetType = currentTool === "jpg-png" ? "image/png" : "image/jpeg";
                    const fileExtension = currentTool === "jpg-png" ? "png" : "jpg";

                    // Trigger the download of converted image
                    const dataUrl = canvas.toDataURL(targetType, 0.9);
                    const link = document.createElement("a");
                    link.download = selectedFile.name.replace(/\.[^/.]+$/, "") + "." + fileExtension;
                    link.href = dataUrl;
                    link.click();

                    showPopup(`✅ Converted to ${fileExtension.toUpperCase()} successfully!`);
                    clearDropArea();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(selectedFile);
        }
    });

    function showPopup(message) {
        if (popupMessage && popup) {
            popupMessage.textContent = message;
            popup.classList.remove("hidden");
        }
    }

    window.closePopup = function () {
        if (popup) popup.classList.add("hidden");
    };
}
