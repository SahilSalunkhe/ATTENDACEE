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
    submitLabel.textContent = busy ? "Submitting Registration..." : "Complete Registration";
  }

  whatsappInput.addEventListener("input", () => {
    whatsappInput.value = whatsappInput.value.replace(/\D/g, "").slice(0, 10);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearStatus();

    const payload = {
      fullName: document.getElementById("fullName").value.trim(),
      department: document.getElementById("department").value.trim(),
      course: document.getElementById("course").value.trim(),
      year: document.getElementById("year").value.trim(),
      whatsapp: whatsappInput.value.trim()
    };

    if (!payload.fullName || !payload.department || !payload.course || !payload.year || !payload.whatsapp) {
      showStatus("Please complete all required fields.", "error");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(payload.whatsapp)) {
      showStatus("Please enter a valid 10-digit Indian mobile number.", "error");
      whatsappInput.focus();
      return;
    }
    if (!document.getElementById("consent").checked) {
      showStatus("Please confirm that your registration details are correct.", "error");
      return;
    }

    setBusy(true);
    showStatus("Submitting your registration. Please wait...", "info");

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok || result.success !== true || !result.code) {
        throw new Error(result.message || "Registration could not be completed.");
      }

      studentCode.textContent = result.code;
      form.hidden = true;
      successPanel.hidden = false;
      successPanel.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (error) {
      console.error("Registration error:", error);
      showStatus(
        error.message && error.message !== "Failed to fetch"
          ? error.message
          : "We couldn't connect to the registration service. Please try again. If the problem continues, contact the event registration team.",
        "error"
      );
    } finally {
      setBusy(false);
    }
  });

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(studentCode.textContent.trim());
      copyButton.textContent = "Copied!";
    } catch {
      showStatus("Please select and copy your attendance code manually.", "info");
    }
  });

  anotherButton.addEventListener("click", () => {
    form.reset();
    clearStatus();
    successPanel.hidden = true;
    form.hidden = false;
    studentCode.textContent = "";
    setBusy(false);
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});
