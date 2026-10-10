// Vercel Serverless Function: browser -> same-origin /api/register -> Apps Script.
// Set APPS_SCRIPT_URL in Vercel Project Settings > Environment Variables.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, message: "Method not allowed." });
  }

  const endpoint = process.env.APPS_SCRIPT_URL;
  if (!endpoint) {
    return res.status(500).json({
      success: false,
      message: "Registration service is not configured. Please contact the event team."
    });
  }

  const { fullName, department, course, year, whatsapp } = req.body || {};
  if (![fullName, department, course, year, whatsapp].every(v => typeof v === "string" && v.trim())) {
    return res.status(400).json({ success: false, message: "Please complete all required fields." });
  }
  if (!/^[6-9]\d{9}$/.test(whatsapp.trim())) {
    return res.status(400).json({ success: false, message: "Please enter a valid 10-digit Indian mobile number." });
  }

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ fullName, department, course, year, whatsapp })
    });

    const text = await upstream.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      console.error("Apps Script returned non-JSON response:", text.slice(0, 500));
      return res.status(502).json({
        success: false,
        message: "The registration server returned an unexpected response. Please contact the event team."
      });
    }

    if (!upstream.ok || result.success !== true || !result.code) {
      console.error("Apps Script registration failure:", result);
      return res.status(502).json({
        success: false,
        message: result.message || "Registration could not be saved. Please try again."
      });
    }

    return res.status(200).json({
      success: true,
      code: result.code,
      message: "Registration saved successfully."
    });
  } catch (error) {
    console.error("Apps Script connection error:", error);
    return res.status(502).json({
      success: false,
      message: "We couldn't connect to the registration server. Please try again later."
    });
  }
}
