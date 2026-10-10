/******************************************************
 * CSMU AARAMBH 2026 — Google Apps Script backend
 *
 * Important:
 * - This script must be bound to the Attendance Management spreadsheet
 *   OR SPREADSHEET_ID must be updated to the correct destination ID.
 * - Update SHEET_NAME to the exact sheet tab name at the bottom.
 * - Expected columns A:F: Unique Code, Full Name, Department,
 *   Course, Year, WhatsApp No.
 ******************************************************/

const SPREADSHEET_ID = "1NqCz8xkVXfowgmECkCW7QrEEC1f9L6mpuFGP16_UNFI";
const SHEET_NAME = "Sheet1"; // Change to exact bottom tab name.
const CODE_PREFIX = "CSMU";

function doGet() {
  return HtmlService
    .createHtmlOutputFromFile("Index")
    .setTitle("AARAMBH 2026 | CSMU Registration")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function registerStudent(data) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(20000);

    if (!data || typeof data !== "object") {
      throw new Error("Registration details were not received.");
    }

    const fullName = cleanValue_(data.fullName);
    const department = cleanValue_(data.department);
    const course = cleanValue_(data.course);
    const year = cleanValue_(data.year);
    const whatsapp = cleanValue_(data.whatsapp);

    if (!fullName || !department || !course || !year || !whatsapp) {
      throw new Error("Please complete all required fields.");
    }

    if (!/^[6-9]\d{9}$/.test(whatsapp)) {
      throw new Error("Please enter a valid 10-digit Indian mobile number.");
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      throw new Error(
        'The sheet tab "' + SHEET_NAME +
        '" was not found. Update SHEET_NAME in Code.gs.'
      );
    }

    // Ensure the expected headers exist if the sheet is empty.
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 6).setValues([[
        "UNIQUE CODE", "FULL NAME", "DEPARTMENT",
        "COURSE", "YEAR", "WHATSAPP NO"
      ]]);
    }

    let highestNumber = 0;
    const lastRow = sheet.getLastRow();

    if (lastRow >= 2) {
      const codes = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
      codes.forEach(row => {
        const match = String(row[0]).trim().match(/^CSMU(\d+)$/i);
        if (match) highestNumber = Math.max(highestNumber, Number(match[1]));
      });
    }

    const code = CODE_PREFIX + (highestNumber + 1);
    const nextRow = Math.max(sheet.getLastRow() + 1, 2);

    // Write code and student details in a single row operation.
    sheet.getRange(nextRow, 1, 1, 6).setValues([[
      code, fullName, department, course, year, whatsapp
    ]]);

    SpreadsheetApp.flush();

    return {
      success: true,
      code: code,
      message: "Registration saved successfully."
    };

  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      message: error && error.message
        ? error.message
        : "Registration could not be completed. Please try again."
    };
  } finally {
    try {
      lock.releaseLock();
    } catch (ignored) {}
  }
}

function cleanValue_(value) {
  return String(value == null ? "" : value).trim();
}
