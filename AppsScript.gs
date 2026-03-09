var CACHE_KEY = "profiles_json";
var CACHE_TTL = 300; // seconds (5 minutes)

function doGet() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CACHE_KEY);
  if (cached) {
    return ContentService
      .createTextOutput(cached)
      .setMimeType(ContentService.MimeType.JSON);
  }

  const json = buildProfiles();
  cache.put(CACHE_KEY, json, CACHE_TTL);

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function buildProfiles() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) return JSON.stringify([]);

  const results = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // Columns: [0] Timestamp, [1] Name, [2] TMU Email, [3] Bio, [4] Photo (optional), [5] Questions
    const entry = {
      name: row[1] ? row[1].toString().trim() : "",
      bio:  row[3] ? row[3].toString().trim() : "",
      imageUrl: ""
    };

    const rawUrl = row[4] ? row[4].toString() : "";
    if (rawUrl) {
      const match = rawUrl.match(/\/d\/([^\/]+)/) || rawUrl.match(/id=([^&]+)/);
      if (match) {
        entry.imageUrl = "https://drive.google.com/thumbnail?id=" + match[1] + "&sz=w400";
      }
    }

    if (entry.name) results.push(entry);
  }

  return JSON.stringify(results);
}

// Attach this to an onFormSubmit trigger to set sharing once at submission time
function onFormSubmit(e) {
  const row = e.values;
  const rawUrl = row[4] ? row[4].toString() : "";
  if (!rawUrl) return;

  const match = rawUrl.match(/\/d\/([^\/]+)/) || rawUrl.match(/id=([^&]+)/);
  if (!match) return;

  try {
    DriveApp.getFileById(match[1]).setSharing(
      DriveApp.Access.ANYONE_WITH_LINK,
      DriveApp.Permission.VIEW
    );
  } catch (e) {}

  // Bust the cache so the new profile appears within seconds
  CacheService.getScriptCache().remove(CACHE_KEY);
}