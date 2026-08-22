//#region PROJECT HEADERS

const PROJECT_HEADERS = [
  "id",
  "project_url",
  "title",
  "description",
  "section",
  "section_category",
  "technologies",
  "platforms",
  "external_url",
  "youtube_url",
  "image_url",
  "categories",

  // =========================================================
  // Submission management
  // =========================================================

  // Original time when this project was first submitted.
  // This value MUST NOT change when the project is updated.
  "submitted_at",

  // Last time this project was created or updated.
  // New project:
  //     updated_at = submitted_at
  //
  // Existing project:
  //     submitted_at = original value
  //     updated_at   = current time
  "updated_at",

  "status",

  // MUST remain the LAST column
  "github",
];

//#endregion

const SHEET_NAME = "submitted";

//#region DO POST

/**
 * Main HTTP POST handler for Google Apps Script.
 */
function doPost(e) {
  // 1. Validate POST body presence
  if (!e || !e.postData || !e.postData.contents) {
    return jsonResponse({
      success: false,
      error: "Missing POST body.",
    });
  }

  // Parse JSON body
  let request;
  try {
    request = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({
      success: false,
      error: "Invalid JSON request body.",
    });
  }

  if (!request || typeof request !== "object") {
    return jsonResponse({
      success: false,
      error: "Invalid request payload structure.",
    });
  }

  if (!request.data) {
    return jsonResponse({
      success: false,
      error: "Missing data object or array.",
    });
  }

  const isBatch = request.batch === true || Array.isArray(request.data);

  // LockService to handle concurrent submissions cleanly
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (err) {
    return jsonResponse({
      success: false,
      error: "Could not acquire script lock within timeout.",
    });
  }

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) {
      return jsonResponse({
        success: false,
        error: "Spreadsheet is not available.",
      });
    }

    const sheet = getOrCreateSheet(spreadsheet);

    // Batch Processing
    if (isBatch) {
      if (!Array.isArray(request.data)) {
        return jsonResponse({
          success: false,
          error: "Batch mode requires 'data' to be an array.",
        });
      }

      const results = [];
      for (let i = 0; i < request.data.length; i++) {
        const item = request.data[i];
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          results.push({ success: false, error: "Invalid item at index " + i });
          continue;
        }
        const res = processSingleProject(sheet, item, true);
        results.push(res);
      }

      return jsonResponse({
        success: true,
        batch: true,
        results: results,
      });
    }

    // Single Item Processing
    if (typeof request.data !== "object" || Array.isArray(request.data)) {
      return jsonResponse({
        success: false,
        error: "Single project request 'data' must be an object.",
      });
    }

    const result = processSingleProject(sheet, request.data, false);
    return jsonResponse(result);
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error && error.message ? error.message : String(error),
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Helper to process create or update logic for a single project payload.
 */
function processSingleProject(sheet, data, isBatch) {
  const projectUrl = String(data.project_url || "").trim();
  if (!projectUrl) {
    return {
      success: false,
      error: "Missing project_url.",
    };
  }

  // Ensure headers exist for all incoming fields
  const headers = ensureHeaders(sheet, data);

  const projectUrlIndex = headers.indexOf("project_url");
  const idIndex = headers.indexOf("id");
  const submittedAtIndex = headers.indexOf("submitted_at");
  const updatedAtIndex = headers.indexOf("updated_at");
  const statusIndex = headers.indexOf("status");

  if (projectUrlIndex === -1) {
    return {
      success: false,
      error: "Sheet is missing the required project_url column.",
    };
  }

  // Efficient search for existing project_url using TextFinder
  let existingRow = -1;
  const lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    const searchRange = sheet.getRange(2, projectUrlIndex + 1, lastRow - 1, 1);
    const match = searchRange
      .createTextFinder(projectUrl)
      .matchEntireCell(true)
      .matchCase(true)
      .findNext();

    if (match) {
      existingRow = match.getRow();
    }
  }

  const now = new Date();

  // ---------------------------------------------------------
  // UPDATE EXISTING PROJECT
  // ---------------------------------------------------------
  if (existingRow !== -1) {
    let existingId = null;
    if (idIndex !== -1) {
      existingId = sheet.getRange(existingRow, idIndex + 1).getValue();
    }
    const finalId = existingId || data.id || Utilities.getUuid();

    let originalSubmittedAt = now;
    if (submittedAtIndex !== -1) {
      const storedSubmittedAt = sheet
        .getRange(existingRow, submittedAtIndex + 1)
        .getValue();
      if (storedSubmittedAt) {
        originalSubmittedAt = storedSubmittedAt;
      }
    }

    let existingStatus = "pending";
    if (statusIndex !== -1) {
      const storedStatus = sheet
        .getRange(existingRow, statusIndex + 1)
        .getValue();
      if (storedStatus) {
        existingStatus = storedStatus;
      }
    }
    const finalStatus = data.status || existingStatus || "pending";

    // Map row values across current headers
    const rowData = headers.map((header) => {
      if (header === "id") return finalId;
      if (header === "submitted_at") return originalSubmittedAt;
      if (header === "updated_at") return now;
      if (header === "status") return finalStatus;

      if (Object.prototype.hasOwnProperty.call(data, header)) {
        return formatValue(data[header]);
      }

      // Preserve existing value if not supplied in incoming POST object
      const colIndex = headers.indexOf(header) + 1;
      return sheet.getRange(existingRow, colIndex).getValue();
    });

    sheet.getRange(existingRow, 1, 1, headers.length).setValues([rowData]);

    if (!isBatch && typeof sendSubmissionAlert === "function") {
      sendSubmissionAlert({
        action: "updated",
        sheetName: SHEET_NAME,
        row: existingRow,
        id: finalId,
        projectUrl: projectUrl,
        data: data,
      });
    }

    return {
      success: true,
      action: "updated",
      sheet: SHEET_NAME,
      id: finalId,
      project_url: projectUrl,
      row: existingRow,
    };
  }

  // ---------------------------------------------------------
  // CREATE NEW PROJECT
  // ---------------------------------------------------------
  const finalId = data.id || Utilities.getUuid();
  const finalStatus = data.status || "pending";

  const rowData = headers.map((header) => {
    if (header === "id") return finalId;
    if (header === "submitted_at") return now;
    if (header === "updated_at") return now;
    if (header === "status") return finalStatus;

    if (Object.prototype.hasOwnProperty.call(data, header)) {
      return formatValue(data[header]);
    }
    return "";
  });

  sheet.appendRow(rowData);
  const newRow = sheet.getLastRow();

  if (!isBatch && typeof sendSubmissionAlert === "function") {
    sendSubmissionAlert({
      action: "created",
      sheetName: SHEET_NAME,
      row: newRow,
      id: finalId,
      projectUrl: projectUrl,
      data: data,
    });
  }

  return {
    success: true,
    action: "created",
    sheet: SHEET_NAME,
    id: finalId,
    project_url: projectUrl,
    row: newRow,
  };
}

//#endregion

//#region DO GET

//#region DO GET

function doGet(e) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    if (!spreadsheet) {
      return jsonResponse({
        success: false,
        error: "Spreadsheet is not available.",
      });
    }

    const parameters = (e && e.parameter) || {};

    // =========================================================
    // 1. Return sheet names
    // =========================================================

    if (Object.prototype.hasOwnProperty.call(parameters, "tablenames")) {
      const sheets = spreadsheet.getSheets();

      const tablenames = sheets.map((sheet) => sheet.getName());

      return jsonResponse({
        success: true,
        count: tablenames.length,
        tablenames: tablenames,
      });
    }

    // =========================================================
    // 2. Section parameter
    // =========================================================

    const section = String(parameters.section || "").trim();

    // =========================================================
    // 3. Parameterless request
    //
    //    Return ALL items from the "submitted" sheet.
    // =========================================================

    if (!section) {
      const submittedSheet = spreadsheet.getSheetByName("submitted");

      if (!submittedSheet) {
        return jsonResponse({
          success: false,
          error: 'Submitted sheet "submitted" does not exist.',
          count: 0,
          items: [],
        });
      }

      return getProjectsFromSheet(submittedSheet);
    }

    // =========================================================
    // 4. Validate section
    // =========================================================

    if (!/^[a-zA-Z0-9_-]+$/.test(section)) {
      return jsonResponse({
        success: false,
        error:
          "Invalid section name. Only letters, numbers, underscores and hyphens are allowed.",
        section: section,
        count: 0,
        items: [],
      });
    }

    if (section.length > 100) {
      return jsonResponse({
        success: false,
        error: "Section name cannot exceed 100 characters.",
        section: section,
        count: 0,
        items: [],
      });
    }

    // =========================================================
    // 5. Get section sheet
    // =========================================================

    const sheet = spreadsheet.getSheetByName(section);

    if (!sheet) {
      return jsonResponse({
        success: false,
        error: `Section "${section}" does not exist.`,
        section: section,
        count: 0,
        items: [],
      });
    }

    return getProjectsFromSheet(sheet, section);
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error && error.message ? error.message : String(error),
      section: null,
      count: 0,
      items: [],
    });
  }
}

//#region GET PROJECTS FROM SHEET

function getProjectsFromSheet(sheet, requestedSection) {
  const lastColumn = sheet.getLastColumn();
  const lastRow = sheet.getLastRow();

  if (lastColumn === 0 || lastRow <= 1) {
    return jsonResponse({
      success: true,
      ...(requestedSection ? { section: requestedSection } : {}),
      count: 0,
      items: [],
    });
  }

  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];

  const values = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();

  // Create header -> column index map
  const headerMap = {};

  headers.forEach((header, index) => {
    const key = String(header || "").trim();

    if (key) {
      headerMap[key] = index;
    }
  });

  const items = values
    .filter((row) => row.some((value) => value !== "" && value !== null))
    .map((row) => {
      const item = {};

      // =======================================================
      // ONLY return PROJECT_HEADERS
      // =======================================================

      PROJECT_HEADERS.forEach((header) => {
        const index = headerMap[header];

        if (index === undefined) {
          return;
        }

        let value = row[index];

        // -----------------------------------------------------
        // Convert JSON strings back to arrays/objects
        // -----------------------------------------------------

        if (typeof value === "string" && value.trim() !== "") {
          const trimmed = value.trim();
          const firstChar = trimmed.charAt(0);

          if (firstChar === "[" || firstChar === "{") {
            try {
              value = JSON.parse(trimmed);
            } catch (error) {
              // Keep original string
            }
          }
        }

        // -----------------------------------------------------
        // Convert Date values to ISO
        // -----------------------------------------------------

        if (Object.prototype.toString.call(value) === "[object Date]") {
          if (!isNaN(value.getTime())) {
            value = value.toISOString();
          }
        }

        item[header] = value;
      });

      // =======================================================
      // Guarantee section
      // =======================================================

      if (
        item.section === undefined ||
        item.section === null ||
        String(item.section).trim() === ""
      ) {
        if (requestedSection) {
          item.section = requestedSection;
        }
      }

      return item;
    });

  const response = {
    success: true,
  };

  if (requestedSection) {
    response.section = requestedSection;
  }

  response.count = items.length;
  response.items = items;

  return jsonResponse(response);
}

//#endregion

//#endregion

//#endregion

//#region CODERBASKET HTML EMAIL ALERT

function sendSubmissionAlert(options) {
  const recipient = "coderbasketcontact@gmail.com";

  try {
    const action = options.action === "created" ? "created" : "updated";
    const data = options.data || {};

    const projectUrl = String(
      options.projectUrl || data.project_url || "",
    ).trim();

    const projectName = getEmailProjectName(data);
    const submitterEmail = getSubmitterEmail(data);

    const title =
      action === "created" ? "New project submitted" : "Project updated";

    const subtitle =
      action === "created"
        ? "A new project has been added to CoderBasket."
        : "An existing project has been updated.";

    const subject =
      action === "created"
        ? "🟢 [CoderBasket] New Project — " + projectName
        : "🔵 [CoderBasket] Project Updated — " + projectName;

    const htmlBody = buildSubmissionEmail({
      action: action,
      title: title,
      subtitle: subtitle,
      projectName: projectName,
      sheetName: options.sheetName,
      row: options.row,
      id: options.id,
      projectUrl: projectUrl,
      data: data,
    });

    const textBody = buildSubmissionTextEmail({
      action: action,
      projectName: projectName,
      sheetName: options.sheetName,
      row: options.row,
      id: options.id,
      projectUrl: projectUrl,
      data: data,
    });

    MailApp.sendEmail({
      to: recipient,
      subject: subject,
      body: textBody,
      htmlBody: htmlBody,
    });

    if (submitterEmail) {
      const submitterHtml = buildSubmitterThankYouEmail({
        action: action,
        projectName: projectName,
        projectUrl: projectUrl,
        sheetName: options.sheetName,
        data: data,
      });

      const submitterText = buildSubmitterThankYouTextEmail({
        action: action,
        projectName: projectName,
        projectUrl: projectUrl,
        sheetName: options.sheetName,
        data: data,
      });

      const submitterSubject =
        action === "created"
          ? "Thank you for submitting " + projectName + " to CoderBasket"
          : "Thank you for updating " + projectName + " on CoderBasket";

      MailApp.sendEmail({
        to: submitterEmail,
        subject: submitterSubject,
        body: submitterText,
        htmlBody: submitterHtml,
      });
    }
  } catch (error) {
    console.error("Submission email failed: " + error.message);
  }
}

function buildSubmissionEmail(options) {
  const isCreated = options.action === "created";
  const statusColor = isCreated ? "#16a34a" : "#2563eb";
  const statusBackground = isCreated ? "#dcfce7" : "#dbeafe";
  const statusText = isCreated ? "NEW SUBMISSION" : "UPDATED SUBMISSION";
  const statusIcon = isCreated ? "✓" : "↻";

  const projectUrl = escapeHtml(options.projectUrl || "");
  const projectName = escapeHtml(options.projectName || "Untitled Project");
  const section = escapeHtml(options.sheetName || "Unknown");
  const id = escapeHtml(String(options.id || "—"));
  const row = escapeHtml(String(options.row || "—"));
  const submittedAt = escapeHtml(formatEmailDate(options.data.submitted_at));
  const status = escapeHtml(String(options.data.status || "pending"));
  const fieldsHtml = buildProjectFieldsHtml(options.data);
  const subtitle = escapeHtml(options.subtitle || "");

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>${projectName}</title>
</head>
<body style="margin:0;padding:0;width:100%;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#111827;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;background:#f3f4f6;margin:0;padding:0;">
<tr>
<td align="center" style="padding:24px 10px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;max-width:680px;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;">
<tr>
<td style="padding:24px 24px;background:#111827;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
<tr>
<td valign="middle">
<div style="font-size:24px;line-height:30px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">CoderBasket</div>
<div style="margin-top:4px;font-size:13px;line-height:20px;color:#9ca3af;">Project submission notification</div>
</td>
<td width="50" align="right" valign="middle">
<div style="width:42px;height:42px;line-height:42px;text-align:center;background:#1f2937;border:1px solid #374151;border-radius:12px;color:#ffffff;font-size:18px;font-weight:700;">&lt;/&gt;</div>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:28px 24px;">
<table cellpadding="0" cellspacing="0" border="0" role="presentation">
<tr>
<td style="background:${statusBackground};color:${statusColor};border-radius:999px;padding:7px 12px;font-size:11px;line-height:16px;font-weight:800;letter-spacing:.5px;white-space:nowrap;">
  ${statusIcon} &nbsp; ${statusText}
</td>
</tr>
</table>
<div style="margin-top:16px;font-size:27px;line-height:34px;font-weight:800;letter-spacing:-0.6px;color:#111827;word-break:break-word;">
  ${projectName}
</div>
<div style="margin-top:8px;font-size:14px;line-height:22px;color:#6b7280;">
  ${subtitle}
</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;margin-top:24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">
<tr>
<td style="padding:18px;">
<div style="font-size:11px;line-height:16px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.7px;">🔗 Project URL</div>
<div style="margin-top:8px;font-size:13px;line-height:21px;word-break:break-all;overflow-wrap:anywhere;">
<a href="${projectUrl}" target="_blank" style="color:#2563eb;text-decoration:none;font-weight:600;">${projectUrl}</a>
</div>
<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-top:14px;">
<tr>
<td bgcolor="#111827" style="border-radius:9px;">
<a href="${projectUrl}" target="_blank" style="display:inline-block;padding:10px 16px;color:#ffffff;background:#111827;border-radius:9px;text-decoration:none;font-size:13px;line-height:18px;font-weight:700;">Open Project&nbsp; →</a>
</td>
</tr>
</table>
</td>
</tr>
</table>
<div style="margin-top:24px;font-size:17px;line-height:24px;font-weight:800;color:#111827;">Submission information</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;margin-top:12px;background:#f9fafb;border:1px solid #eef0f3;border-radius:12px;">
<tr>
<td width="52" valign="top" style="padding:16px 0 16px 16px;font-size:20px;">📁</td>
<td valign="top" style="padding:14px 16px 14px 10px;">
<div style="font-size:10px;line-height:15px;color:#6b7280;text-transform:uppercase;font-weight:800;letter-spacing:.6px;">Section</div>
<div style="margin-top:3px;font-size:14px;line-height:20px;font-weight:700;color:#111827;word-break:break-word;">${section}</div>
</td>
</tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;margin-top:8px;background:#f9fafb;border:1px solid #eef0f3;border-radius:12px;">
<tr>
<td width="52" valign="top" style="padding:16px 0 16px 16px;font-size:20px;">🆔</td>
<td valign="top" style="padding:14px 16px 14px 10px;">
<div style="font-size:10px;line-height:15px;color:#6b7280;text-transform:uppercase;font-weight:800;letter-spacing:.6px;">Project ID</div>
<div style="margin-top:3px;font-size:13px;line-height:20px;font-weight:700;color:#111827;word-break:break-all;">${id}</div>
</td>
</tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;margin-top:8px;background:#f9fafb;border:1px solid #eef0f3;border-radius:12px;">
<tr>
<td width="52" valign="top" style="padding:16px 0 16px 16px;font-size:20px;">📌</td>
<td valign="top" style="padding:14px 16px 14px 10px;">
<div style="font-size:10px;line-height:15px;color:#6b7280;text-transform:uppercase;font-weight:800;letter-spacing:.6px;">Status</div>
<div style="margin-top:3px;font-size:14px;line-height:20px;font-weight:700;color:#111827;word-break:break-word;">${status}</div>
</td>
</tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;margin-top:8px;background:#f9fafb;border:1px solid #eef0f3;border-radius:12px;">
<tr>
<td width="52" valign="top" style="padding:16px 0 16px 16px;font-size:20px;">🕐</td>
<td valign="top" style="padding:14px 16px 14px 10px;">
<div style="font-size:10px;line-height:15px;color:#6b7280;text-transform:uppercase;font-weight:800;letter-spacing:.6px;">Submitted</div>
<div style="margin-top:3px;font-size:14px;line-height:20px;font-weight:700;color:#111827;word-break:break-word;">${submittedAt}</div>
</td>
</tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;margin-top:8px;background:#f9fafb;border:1px solid #eef0f3;border-radius:12px;">
<tr>
<td width="52" valign="top" style="padding:16px 0 16px 16px;font-size:20px;">📊</td>
<td valign="top" style="padding:14px 16px 14px 10px;">
<div style="font-size:10px;line-height:15px;color:#6b7280;text-transform:uppercase;font-weight:800;letter-spacing:.6px;">Sheet Row</div>
<div style="margin-top:3px;font-size:14px;line-height:20px;font-weight:700;color:#111827;">${row}</div>
</td>
</tr>
</table>
<div style="margin-top:28px;font-size:18px;line-height:24px;font-weight:800;color:#111827;">Project details</div>
<div style="margin-top:12px;">${fieldsHtml}</div>
</td>
</tr>
<tr>
<td style="padding:22px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">
<div style="font-size:12px;line-height:20px;color:#9ca3af;">This is an automated notification from <strong style="color:#6b7280;">CoderBasket</strong>.</div>
<div style="margin-top:5px;font-size:11px;line-height:18px;color:#c0c5cc;">Please do not reply to this automated message.</div>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

function buildProjectFieldsHtml(data) {
  const excludedFields = [
    "project_url",
    "id",
    "status",
    "submitted_at",
    "section",
  ];
  let html = "";

  Object.keys(data).forEach((key) => {
    if (excludedFields.indexOf(key) !== -1) return;

    const value = data[key];
    if (value === undefined || value === null || value === "") return;

    const label = formatFieldLabel(key);
    let displayValue;

    if (Array.isArray(value)) {
      displayValue = value
        .map(
          (item) => `
              <span style="display:inline-block;background:#eef2ff;color:#4338ca;border:1px solid #e0e7ff;border-radius:999px;padding:5px 9px;margin:2px 3px 3px 0;font-size:11px;line-height:15px;font-weight:600;white-space:normal;">
                ${escapeHtml(formatValue(item))}
              </span>
            `,
        )
        .join("");
    } else if (typeof value === "object") {
      displayValue = buildObjectHtml(value);
    } else {
      displayValue = escapeHtml(String(value)).replace(/\n/g, "<br>");
    }

    html += `
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;margin-bottom:10px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;">
<tr>
<td style="padding:14px 16px 5px 16px;">
<div style="font-size:10px;line-height:15px;color:#6b7280;font-weight:800;text-transform:uppercase;letter-spacing:.5px;">${escapeHtml(label)}</div>
</td>
</tr>
<tr>
<td style="padding:3px 16px 15px 16px;font-size:13px;line-height:21px;color:#374151;word-break:break-word;overflow-wrap:anywhere;">${displayValue}</td>
</tr>
</table>`;
  });

  if (!html) {
    return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
<tr>
<td style="padding:18px;font-size:13px;line-height:20px;color:#9ca3af;">No additional project details were submitted.</td>
</tr>
</table>`;
  }

  return html;
}

function buildObjectHtml(object) {
  let html = "";
  Object.keys(object).forEach((key) => {
    const value = object[key];
    if (value === undefined || value === null || value === "") return;

    html += `
      <div style="margin-bottom:6px;">
        <span style="color:#6b7280;font-weight:600;">${escapeHtml(formatFieldLabel(key))}: </span>
        ${escapeHtml(formatValue(value))}
      </div>`;
  });
  return html;
}

function buildSubmissionTextEmail(options) {
  const data = options.data || {};
  let text = "CODERBASKET\n====================\n\n";

  text +=
    options.action === "created"
      ? "NEW PROJECT SUBMITTED\n\n"
      : "PROJECT UPDATED\n\n";

  text += "Project: " + options.projectName + "\n";
  text += "Section: " + options.sheetName + "\n";
  text += "ID: " + (options.id || "—") + "\n";
  text += "Row: " + (options.row || "—") + "\n";
  text += "Status: " + (data.status || "pending") + "\n";
  text += "Submitted: " + formatEmailDate(data.submitted_at) + "\n\n";
  text += "PROJECT URL\n" + options.projectUrl + "\n\n";
  text += "PROJECT DETAILS\n--------------------\n";

  Object.keys(data).forEach((key) => {
    const value = data[key];
    if (value === undefined || value === null || value === "") return;
    text += formatFieldLabel(key) + ": " + formatValue(value) + "\n";
  });

  return text;
}

//#endregion

//#region SUBMITTER THANK YOU EMAIL

function buildSubmitterThankYouEmail(options) {
  const isCreated = options.action === "created";
  const projectName = escapeHtml(options.projectName || "your project");
  const projectUrl = escapeHtml(options.projectUrl || "");
  const section = escapeHtml(options.sheetName || "CoderBasket");

  const heading = isCreated
    ? "Thank you for your submission! 🎉"
    : "Thank you for the update! ✨";

  const message = isCreated
    ? "We've received your project and it has been successfully submitted to CoderBasket."
    : "We've received your project update and it has been successfully submitted to CoderBasket.";

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>Thank you — CoderBasket</title>
</head>
<body style="margin:0;padding:0;width:100%;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#111827;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;background:#f3f4f6;">
<tr>
<td align="center" style="padding:24px 10px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;max-width:680px;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;">
<tr>
<td style="padding:24px;background:#111827;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
<tr>
<td valign="middle">
<div style="font-size:24px;line-height:30px;font-weight:800;letter-spacing:-.5px;color:#ffffff;">CoderBasket</div>
<div style="margin-top:4px;font-size:13px;line-height:20px;color:#9ca3af;">Developer projects &amp; resources</div>
</td>
<td width="50" align="right" valign="middle">
<div style="width:42px;height:42px;line-height:42px;text-align:center;background:#1f2937;border:1px solid #374151;border-radius:12px;color:#ffffff;font-size:18px;font-weight:700;">&lt;/&gt;</div>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:32px 24px;">
<table cellpadding="0" cellspacing="0" border="0" role="presentation">
<tr>
<td style="width:64px;height:64px;background:#dcfce7;border:1px solid #bbf7d0;border-radius:18px;text-align:center;vertical-align:middle;font-size:30px;">✓</td>
</tr>
</table>
<div style="margin-top:22px;font-size:28px;line-height:36px;font-weight:800;letter-spacing:-.7px;color:#111827;">${heading}</div>
<div style="margin-top:10px;font-size:15px;line-height:24px;color:#6b7280;">${message}</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-top:26px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">
<tr>
<td style="padding:20px;">
<div style="font-size:10px;line-height:15px;color:#64748b;text-transform:uppercase;font-weight:800;letter-spacing:.7px;">YOUR PROJECT</div>
<div style="margin-top:7px;font-size:20px;line-height:28px;font-weight:800;color:#111827;word-break:break-word;">${projectName}</div>
<div style="margin-top:5px;font-size:12px;line-height:19px;color:#64748b;">📁 ${section}</div>
<div style="margin-top:15px;padding-top:15px;border-top:1px solid #e2e8f0;font-size:13px;line-height:21px;word-break:break-all;overflow-wrap:anywhere;">
<a href="${projectUrl}" target="_blank" style="color:#2563eb;text-decoration:none;font-weight:600;">${projectUrl}</a>
</div>
<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-top:15px;">
<tr>
<td bgcolor="#111827" style="border-radius:9px;">
<a href="${projectUrl}" target="_blank" style="display:inline-block;padding:11px 17px;background:#111827;color:#ffffff;border-radius:9px;text-decoration:none;font-size:13px;line-height:18px;font-weight:700;">View Project&nbsp; →</a>
</td>
</tr>
</table>
</td>
</tr>
</table>
<div style="margin-top:28px;font-size:18px;line-height:25px;font-weight:800;color:#111827;">What happens next?</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-top:12px;">
<tr>
<td width="44" valign="top" style="padding:12px 0;">
<div style="width:30px;height:30px;line-height:30px;text-align:center;background:#eff6ff;border:1px solid #dbeafe;border-radius:10px;color:#2563eb;font-size:13px;font-weight:800;">1</div>
</td>
<td valign="top" style="padding:9px 0 12px 8px;">
<div style="font-size:14px;line-height:20px;font-weight:700;color:#111827;">Submission received</div>
<div style="margin-top:2px;font-size:12px;line-height:19px;color:#6b7280;">Your project information has been received successfully.</div>
</td>
</tr>
<tr>
<td width="44" valign="top" style="padding:12px 0;">
<div style="width:30px;height:30px;line-height:30px;text-align:center;background:#f5f3ff;border:1px solid #ede9fe;border-radius:10px;color:#7c3aed;font-size:13px;font-weight:800;">2</div>
</td>
<td valign="top" style="padding:9px 0 12px 8px;">
<div style="font-size:14px;line-height:20px;font-weight:700;color:#111827;">Project review</div>
<div style="margin-top:2px;font-size:12px;line-height:19px;color:#6b7280;">The CoderBasket team can review the submitted information.</div>
</td>
</tr>
<tr>
<td width="44" valign="top" style="padding:12px 0;">
<div style="width:30px;height:30px;line-height:30px;text-align:center;background:#ecfdf5;border:1px solid #d1fae5;border-radius:10px;color:#059669;font-size:13px;font-weight:800;">3</div>
</td>
<td valign="top" style="padding:9px 0 12px 8px;">
<div style="font-size:14px;line-height:20px;font-weight:700;color:#111827;">CoderBasket listing</div>
<div style="margin-top:2px;font-size:12px;line-height:19px;color:#6b7280;">If approved, your project can appear in the appropriate CoderBasket collection.</div>
</td>
</tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-top:24px;background:#f0fdf4;border:1px solid #dcfce7;border-radius:14px;">
<tr>
<td style="padding:17px 18px;">
<div style="font-size:13px;line-height:21px;color:#166534;">
<strong>Thank you for contributing to CoderBasket.</strong> Your contribution helps developers discover useful projects, tools, and resources.
</div>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:22px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">
<div style="font-size:12px;line-height:20px;color:#9ca3af;">This is an automated message from <strong style="color:#6b7280;">CoderBasket</strong>.</div>
<div style="margin-top:5px;font-size:11px;line-height:18px;color:#c0c5cc;">You received this email because an email address was provided with a project submission.</div>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

function buildSubmitterThankYouTextEmail(options) {
  let text = "CODERBASKET\n====================\n\n";

  if (options.action === "created") {
    text +=
      "THANK YOU FOR YOUR SUBMISSION!\n\nWe've received your project and it has been successfully submitted to CoderBasket.\n\n";
  } else {
    text +=
      "THANK YOU FOR THE UPDATE!\n\nWe've received your project update and it has been successfully submitted to CoderBasket.\n\n";
  }

  text += "PROJECT\n--------------------\n";
  text += "Project: " + options.projectName + "\n";
  text += "Section: " + options.sheetName + "\n";
  text += "URL: " + options.projectUrl + "\n\n";
  text +=
    "WHAT HAPPENS NEXT\n1. Submission received\n2. Project review\n3. If approved, the project can appear in the appropriate CoderBasket collection.\n\n";
  text +=
    "Thank you for contributing to CoderBasket!\n\nThis is an automated message.";

  return text;
}

//#endregion

//#region HELPERS

/**
 * Returns or initializes the single target "submitted" sheet with PROJECT_HEADERS & formatting.
 */
function getOrCreateSheet(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastColumn() === 0) {
    setupSheet(sheet);
  }
  return sheet;
}

/**
 * Compares incoming object keys against sheet headers and appends missing headers.
 */
function ensureHeaders(sheet, data) {
  let lastCol = sheet.getLastColumn();
  let headers = [];

  if (lastCol > 0) {
    headers = sheet
      .getRange(1, 1, 1, lastCol)
      .getValues()[0]
      .map((h) => String(h || "").trim());
  } else {
    setupSheet(sheet);
    headers = [...PROJECT_HEADERS];
  }

  const incomingKeys = Object.keys(data);
  const missingKeys = incomingKeys.filter(
    (key) => key && !headers.includes(key),
  );

  if (missingKeys.length > 0) {
    const startCol = headers.length + 1;
    sheet.getRange(1, startCol, 1, missingKeys.length).setValues([missingKeys]);
    SpreadsheetApp.flush();
    // Re-read full updated headers list
    headers = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0]
      .map((h) => String(h || "").trim());
  }

  return headers;
}

function setupSheet(sheet) {
  sheet.getRange(1, 1, 1, PROJECT_HEADERS.length).setValues([PROJECT_HEADERS]);
  sheet
    .getRange(1, 1, 1, PROJECT_HEADERS.length)
    .setFontWeight("bold")
    .setBackground("#1f2937")
    .setFontColor("#ffffff");

  sheet.setFrozenRows(1);

  const filterRange = sheet.getRange(
    1,
    1,
    Math.max(sheet.getMaxRows(), 2),
    PROJECT_HEADERS.length,
  );

  if (sheet.getFilter()) {
    sheet.getFilter().remove();
  }

  filterRange.createFilter();
  sheet.autoResizeColumns(1, PROJECT_HEADERS.length);
  SpreadsheetApp.flush();
}

function getSubmitterEmail(data) {
  if (!data) return "";
  const possibleFields = ["email", "submitter_email", "contact_email"];

  for (let i = 0; i < possibleFields.length; i++) {
    const key = possibleFields[i];
    if (data[key] !== undefined && data[key] !== null) {
      const email = String(data[key]).trim();
      if (email && isValidEmail(email)) {
        return email;
      }
    }
  }
  return "";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function escapeHtml(value) {
  return String(value === undefined || value === null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatEmailDate(value) {
  if (!value) return "—";
  try {
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return String(value);

    return Utilities.formatDate(
      date,
      Session.getScriptTimeZone(),
      "MMM d, yyyy • h:mm a",
    );
  } catch (error) {
    return String(value);
  }
}

function formatValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return String(value);
    }
  }
  return value;
}

function formatFieldLabel(key) {
  return String(key)
    .replace(/[_-]+/g, " ")
    .replace(
      /\w\S*/g,
      (word) => word.charAt(0).toUpperCase() + word.substring(1),
    );
}

function getEmailProjectName(data) {
  const possibleNames = [
    "name",
    "project_name",
    "title",
    "project_title",
    "display_name",
  ];

  for (let i = 0; i < possibleNames.length; i++) {
    const key = possibleNames[i];
    if (
      data[key] !== undefined &&
      data[key] !== null &&
      String(data[key]).trim() !== ""
    ) {
      return String(data[key]).trim();
    }
  }

  if (data.project_url) {
    try {
      const url = new URL(String(data.project_url));
      return url.hostname + url.pathname;
    } catch (error) {
      // Ignore invalid URL
    }
  }

  return "Untitled Project";
}

//#endregion

//#region DEBUG / TEST SUBMISSION

function testSampleSubmission() {
  const sampleProject = {
    project_url: "https://github.com/files-community/Files",
    title: "Files",
    description:
      "A modern file manager that helps users organize their files and folders.",
    section: "dotnet",
    section_category: "alternatives",
    technologies: [".NET", "C#", "WinUI"],
    platforms: ["windows"],
    external_url: "https://files.community/",
    youtube_url: null,
    image_url:
      "https://raw.githubusercontent.com/files-community/Files/main/Files.App/Assets/Images/Files.png",
    categories: [1, 5, 12],
    github: {
      stars: 1000,
      forks: 100,
      watchers: 1000,
      language: "C#",
      open_issues: 20,
      license: "MIT",
      default_branch: "main",
      archived: false,
      is_fork: false,
      topics: ["dotnet", "csharp", "winui", "windows", "file-manager"],
      created_at: "2020-01-01T00:00:00Z",
      updated_at: "2026-08-19T00:00:00Z",
      pushed_at: "2026-08-19T00:00:00Z",
    },
  };

  const fakeRequest = {
    postData: {
      contents: JSON.stringify({
        data: sampleProject,
      }),
    },
  };

  const response = doPost(fakeRequest);
  const result = response.getContent();

  Logger.log("========================================");
  Logger.log("TEST SUBMISSION RESULT");
  Logger.log("========================================");
  Logger.log(result);

  return result;
}

//#endregion
