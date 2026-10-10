/******************************************************
 * CSMU AARAMBH 2026 — Apps Script JSON endpoint
 * Paste into Code.gs in the script project attached to
 * the Attendance Management 2026 spreadsheet.
 ******************************************************/

const SPREADSHEET_ID = "1NqCz8xkVXfowgmECkCW7QrEEC1f9L6mpuFGP16_UNFI";
const SHEET_NAME = "Sheet1"; // CHANGE to exact sheet tab name.
const CODE_PREFIX = "CSMU";

function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    const data = JSON.parse(raw);
    const result = saveRegistration_(data);
    return jsonOutput_(result);
  } catch (error) {
    console.error("doPost error:", error);
    return jsonOutput_({
      success: false,
      message: error && error.message ? error.message : "Registration could not be saved."
    });
  }
}

function saveRegistration_(data) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(20000);

    const fullName = clean_(data.fullName);
    const department = clean_(data.department);
    const course = clean_(data.course);
    const year = clean_(data.year);
    const whatsapp = clean_(data.whatsapp);

    if (!fullName || !department || !course || !year || !whatsapp) {
      throw new Error("Please complete all required fields.");
    }
    if (!/^[6-9]\d{9}$/.test(whatsapp)) {
      throw new Error("Please enter a valid 10-digit Indian mobile number.");
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error('Sheet tab "' + SHEET_NAME + '" was not found. Update SHEET_NAME in Code.gs.');
    }

    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 6).setValues([[
        "UNIQUE CODE", "FULL NAME", "DEPARTMENT", "COURSE", "YEAR", "WHATSAPP NO"
      ]]);
    }

    let highest = 0;
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues().forEach(row => {
        const match = String(row[0]).trim().match(/^CSMU(\d+)$/i);
        if (match) highest = Math.max(highest, Number(match[1]));
      });
    }

    const code = CODE_PREFIX + (highest + 1);
    const row = Math.max(sheet.getLastRow() + 1, 2);
    sheet.getRange(row, 1, 1, 6).setValues([[
      code, fullName, department, course, year, whatsapp
    ]]);
    SpreadsheetApp.flush();

    return { success: true, code: code, message: "Registration saved successfully." };
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}

function jsonOutput_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function clean_(value) {
  return String(value == null ? "" : value).trim();
}
