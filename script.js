/*
  CSMU AARAMBH 2026 — Website form connected to Google Apps Script.

  This sends registration details to your deployed Apps Script Web App.
  The real attendance code comes from the server response (not generated here).
*/

const form = document.getElementById("registration-form");
const statusBox = document.getElementById("status");
const successPanel = document.getElementById("success-panel");
const studentCode = document.getElementById("student-code");
const submitButton = form ? form.querySelector('button[type="submit"]') : null;
const whatsappInput = document.getElementById("whatsapp");

function showMessage(message, type = "info") {
  if (!statusBox) return;
  statusBox.textContent = message;
  statusBox.style.display = "block";
  statusBox.className = type;
}

function clearMessage() {
  if (!statusBox) return;
  statusBox.textContent = "";
  statusBox.style.display = "none";
  statusBox.className = "";
}

if (whatsappInput) {
  whatsappInput.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "").slice(0, 10);
  });
}

if (form) {
  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    clearMessage();

    const payload = {
      fullName: document.getElementById("fullName").value.trim(),
      department: document.getElementById("department").value.trim(),
      course: document.getElementById("course").value.trim(),
      year: document.getElementById("year").value.trim(),
      whatsapp: whatsappInput.value.trim()
    };

    const consent = form.querySelector('input[type="checkbox"]');

    if (!payload.fullName || !payload.department || !payload.course ||
        !payload.year || !payload.whatsapp) {
      showMessage("Please complete all required fields.", "error");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(payload.whatsapp)) {
      showMessage("Please enter a valid 10-digit Indian mobile number.", "error");
      return;
    }

    if (consent && !consent.checked) {
      showMessage("Please confirm that your details are correct.", "error");
      return;
    }

    const endpoint = window.CSMU_CONFIG?.APPS_SCRIPT_URL;
    if (!endpoint || !endpoint.includes("/macros/s/")) {
      showMessage("Registration service is not configured. Please contact the event team.", "error");
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.dataset.originalText = submitButton.textContent;
      submitButton.textContent = "Submitting registration...";
    }

    try {
      /*
        Apps Script ContentService redirects responses. A no-cors request would
        hide the JSON response, so this normal request expects the deployed Web
        App to permit browser access. If the browser reports a CORS error, use
        the follow-up fix described in the setup notes / adjust the integration.
      */
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        redirect: "follow"
      });

      const result = await response.json();

      if (!result.success || !result.code) {
        throw new Error(result.message || "Registration could not be confirmed.");
      }

      studentCode.textContent = result.code;
      form.hidden = true;
      successPanel.hidden = false;
      successPanel.scrollIntoView({ behavior: "smooth", block: "center" });

    } catch (error) {
      showMessage(
        "Registration could not be confirmed. Check the Apps Script deployment, sheet tab name, and browser console. No code should be shown unless the server returns it.",
        "error"
      );
      console.error("AARAMBH registration error:", error);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = submitButton.dataset.originalText || "Complete Registration";
      }
    }
  });
}
