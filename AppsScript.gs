function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const results = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // Columns: [0] Timestamp, [1] Name, [2] TMU Email, [3] Bio, [4] Photo (optional), [5] Questions
    const entry = {
      name: row[1] ? row[1].toString().trim() : "",
      bio:  row[3] ? row[3].toString().trim() : "",
      imageUrl: ""
    };

    // Convert Google Drive file link → public direct image URL
    const rawUrl = row[4] ? row[4].toString() : "";
    if (rawUrl) {
      const match = rawUrl.match(/\/d\/([^\/]+)/) || rawUrl.match(/id=([^&]+)/);
      if (match) {
        const fileId = match[1];
        try {
          // Make the uploaded file publicly viewable
          DriveApp.getFileById(fileId).setSharing(
            DriveApp.Access.ANYONE_WITH_LINK,
            DriveApp.Permission.VIEW
          );
          entry.imageUrl = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w400";
        } catch (e) {
          // File may already be shared or inaccessible — skip
        }
      }
    }

    if (entry.name) results.push(entry);
  }

  return ContentService
    .createTextOutput(JSON.stringify(results))
    .setMimeType(ContentService.MimeType.JSON);
}