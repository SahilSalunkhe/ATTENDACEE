/*
 * CSMU AARAMBH 2026 — Client-side form logic
 * Runs inside the Apps Script Web App and calls registerStudent(payload).
 */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registration-form");
  const statusBox = document.getElementById("status");
  const successPanel = document.getElementById("success-panel");
  const studentCode = document.getElementById("student-code");
  const submitButton = document.getElementById("submit-button");
  const submitLabel = document.getElementById("submit-label");
  const whatsappInput = document.getElementById("whatsapp");
  const copyButton = document.getElementById("copy-code");
  const anotherButton = document.getElementById("register-another");

  function showStatus(message, type = "error") {
    statusBox.textContent = message;
    statusBox.className = "status show " + type;
  }

  function clearStatus() {
    statusBox.textContent = "";
    statusBox.className = "status";
  }

  function setBusy(busy) {
    submitButton.disabled = busy;
    submitLabel.textContent = busy
      ? "Submitting Registration..."
      : "Complete Registration";
  }

  whatsappInput.addEventListener("input", () => {
    whatsappInput.value = whatsappInput.value.replace(/\D/g, "").slice(0, 10);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearStatus();

    const payload = {
      fullName: document.getElementById("fullName").value.trim(),
      department: document.getElementById("department").value.trim(),
      course: document.getElementById("course").value.trim(),
      year: document.getElementById("year").value.trim(),
      whatsapp: whatsappInput.value.trim()
    };

    if (!payload.fullName || !payload.department || !payload.course ||
        !payload.year || !payload.whatsapp) {
      showStatus("Please complete all required fields.", "error");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(payload.whatsapp)) {
      showStatus("Please enter a valid 10-digit Indian mobile number.", "error");
      whatsappInput.focus();
      return;
    }

    if (!document.getElementById("consent").checked) {
      showStatus("Please confirm that your details are correct.", "error");
      return;
    }

    if (typeof google === "undefined" || !google.script || !google.script.run) {
      showStatus(
        "Registration service is unavailable. Please open the official registration link and try again.",
        "error"
      );
      console.error("google.script.run is unavailable. Open the deployed Apps Script /exec URL, not a local HTML file.");
      return;
    }

    setBusy(true);
    showStatus("Submitting your registration. Please wait...", "info");

    google.script.run
      .withSuccessHandler((result) => {
        setBusy(false);

        if (!result || result.success !== true || !result.code) {
          showStatus(
            result && result.message
              ? result.message
              : "Registration could not be completed. Please check your details and try again. If the problem continues, contact the event registration team.",
            "error"
          );
          return;
        }

        studentCode.textContent = result.code;
        form.hidden = true;
        successPanel.hidden = false;
        successPanel.scrollIntoView({ behavior: "smooth", block: "center" });
      })
      .withFailureHandler((error) => {
        setBusy(false);
        console.error("Apps Script error:", error);
        showStatus(
          "We couldn't save your registration. Please try again. If the problem continues, contact the event registration team.",
          "error"
        );
      })
      .registerStudent(payload);
  });

  copyButton.addEventListener("click", async () => {
    const code = studentCode.textContent.trim();
    try {
      await navigator.clipboard.writeText(code);
      copyButton.textContent = "Copied!";
    } catch (error) {
      showStatus("Please select and copy your attendance code manually.", "info");
    }
  });

  anotherButton.addEventListener("click", () => {
    form.reset();
    clearStatus();
    successPanel.hidden = true;
    form.hidden = false;
    studentCode.textContent = "";
    submitButton.disabled = false;
    submitLabel.textContent = "Complete Registration";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});
