// Server-side only. Configure ATLAS_SHEET_ID and ATLAS_WEBHOOK_SECRET in Script Properties.
// Deploy as a web app executing as the owner. The spreadsheet itself stays private.
function doPost(event) {
  var lock = LockService.getScriptLock()
  try {
    var raw = event && event.postData && event.postData.contents
    if (!raw || raw.length > 2048) return json_({ ok: false, code: "invalid_request" })
    var body = JSON.parse(raw)
    var properties = PropertiesService.getScriptProperties()
    var secret = properties.getProperty("ATLAS_WEBHOOK_SECRET")
    if (!secret || secret.length < 32 || body.secret !== secret)
      return json_({ ok: false, code: "unauthorized" })
    if (body.type === "suggestion") return appendSuggestion_(body, properties, lock)
    var email = normalizeEmail_(body.email)
    if (
      !email ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        body.visitId || "",
      )
    ) {
      return json_({ ok: false, code: "invalid_request" })
    }
    if (!lock.tryLock(10000)) return json_({ ok: false, code: "busy" })
    var cache = CacheService.getScriptCache()
    var key =
      "visit:" +
      body.visitId +
      ":" +
      Utilities.base64EncodeWebSafe(
        Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, email),
      )
    if (cache.get(key)) return json_({ ok: true })
    // Global ceiling also applies across Vercel instances; no additional personal data.
    var minuteKey = "rate:" + Math.floor(Date.now() / 60000)
    var count = Number(cache.get(minuteKey) || 0)
    if (count >= 120) return json_({ ok: false, code: "rate_limited" })
    cache.put(minuteKey, String(count + 1), 120)
    var sheet = SpreadsheetApp.openById(properties.getProperty("ATLAS_SHEET_ID")).getSheetByName(
      "Acessos",
    )
    if (
      !sheet ||
      sheet.getRange(1, 1, 1, 4).getValues()[0].join(",") !==
        "email,primeiro_acesso,ultimo_acesso,acessos"
    ) {
      return json_({ ok: false, code: "configuration" })
    }
    var lastRow = sheet.getLastRow()
    var match =
      lastRow > 1
        ? sheet
            .getRange(2, 1, lastRow - 1, 1)
            .createTextFinder(email)
            .matchEntireCell(true)
            .matchCase(false)
            .useRegularExpression(false)
            .findNext()
        : null
    var now = new Date()
    if (match) {
      var row = match.getRow()
      var accesses = Number(sheet.getRange(row, 4).getValue())
      if (!Number.isSafeInteger(accesses) || accesses < 1)
        return json_({ ok: false, code: "invalid_counter" })
      sheet.getRange(row, 3, 1, 2).setValues([[now, accesses + 1]])
    } else {
      var row = lastRow + 1
      // A leading apostrophe makes formula-like e-mails literal Google Sheets text.
      var literalEmail = /^[=+\-@]/.test(email) ? "'" + email : email
      sheet.getRange(row, 1, 1, 4).setValues([[literalEmail, now, now, 1]])
    }
    sheet.getRange(row, 2, 1, 2).setNumberFormat("yyyy-mm-dd hh:mm:ss")
    SpreadsheetApp.flush()
    // Retrying the same request after a lost response does not increment again (6h cache).
    cache.put(key, "1", 21600)
    return json_({ ok: true })
  } catch (_) {
    return json_({ ok: false, code: "registration_unavailable" })
  } finally {
    if (lock.hasLock()) lock.releaseLock()
  }
}

function appendSuggestion_(body, properties, lock) {
  var title = normalizeSuggestionText_(body.title, 160)
  var description = normalizeSuggestionText_(body.description, 2000)
  if (
    !title ||
    !description ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      body.submissionId || "",
    )
  ) {
    return json_({ ok: false, code: "invalid_request" })
  }
  if (!lock.tryLock(10000)) return json_({ ok: false, code: "busy" })
  try {
    var cache = CacheService.getScriptCache()
    var idempotencyKey = "suggestion:" + body.submissionId
    if (cache.get(idempotencyKey)) return json_({ ok: true })
    var minuteKey = "suggestion-rate:" + Math.floor(Date.now() / 60000)
    var count = Number(cache.get(minuteKey) || 0)
    if (count >= 120) return json_({ ok: false, code: "rate_limited" })
    cache.put(minuteKey, String(count + 1), 120)
    var sheet = SpreadsheetApp.openById(properties.getProperty("ATLAS_SHEET_ID")).getSheetByName(
      "Sugestões",
    )
    if (
      !sheet ||
      sheet.getRange(1, 1, 1, 4).getValues()[0].join(",") !==
        "timestamp,titulo,descricao,submission_id"
    ) {
      return json_({ ok: false, code: "configuration" })
    }
    var row = sheet.getLastRow() + 1
    sheet
      .getRange(row, 1, 1, 4)
      .setValues([[new Date(), literalText_(title), literalText_(description), body.submissionId]])
    sheet.getRange(row, 1).setNumberFormat("yyyy-mm-dd hh:mm:ss")
    SpreadsheetApp.flush()
    cache.put(idempotencyKey, "1", 21600)
    return json_({ ok: true })
  } finally {
    if (lock.hasLock()) lock.releaseLock()
  }
}

function normalizeSuggestionText_(value, maximum) {
  if (typeof value !== "string" || value.length > maximum) return null
  var text = value.trim()
  return text ? text : null
}

function literalText_(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(
    ContentService.MimeType.JSON,
  )
}

function normalizeEmail_(value) {
  if (typeof value !== "string" || value.length > 254) return null
  var email = value.trim().toLowerCase()
  var parts = email.split("@")
  if (parts.length !== 2) return null
  var local = parts[0]
  if (
    !local ||
    local.length > 64 ||
    local.startsWith(".") ||
    local.endsWith(".") ||
    local.includes("..") ||
    !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local)
  )
    return null
  var labels = parts[1].split(".")
  if (
    labels.length < 2 ||
    labels.some(function (label) {
      return !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label)
    })
  )
    return null
  return email
}
