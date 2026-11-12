var PROMPT_PREFIX_ = "Turn my raw listing notes into field values for the TSC Listing Intake form. My notes are often voice-to-text and come in garbled. I may also paste a clean structured data sheet (specs, taxes, comps).\n\nSTEP 1 - READ THE NOTES\n- Decode obvious voice-to-text errors (e.g. \"Faced fat air\" = forced hot air, \"never W/D\" = newer washer and dryer, \"septic getting pumped\" = septic).\n- If a fragment can't be decoded confidently, leave it out and list it in flags.\n- I may attach photos, PDFs, or documents (a handwritten intake, a reMarkable page, a tax record, or a data sheet). Read them. They count as notes.\n- If I provide BOTH messy notes and a structured data sheet or file, the structured sheet or file wins on any conflict but put the messy notes info in notes. Call out every conflict explicitly in flags (old value vs new value).\n\nSTEP 2 - FILL THE FORM\nFill only what the notes or data support. For these fields, NEVER invent a value. If it isn't explicitly given, mark NEEDS INPUT:\n- Style of Dwelling (style) and Primary Style (primaryStyle)\n- Exterior / siding material (exterior)\n- Kitchen area type (kitchen)\n- Garage space count (garageSpaces)\n- Propane or solar leased vs owned (do not pick Gas-Propane Leased, Gas-Propane Owned, Solar-Leased, or Solar-Owned unless the notes say which)\nTwo allowed judgment calls, but you MUST list them in flags:\n- Roof: if only age is given, default to Asphalt Shingle (regional norm).\n- \"Leased\" in notes maps to propane, since that's the only fuel with a leased/owned split. Use Gas-Propane Leased and say so in flags.\nApply Fair Housing to the notes text: describe the property and its features only. No references to people, family status, demographics, religion, \"safe,\" schools or \"walking distance to [place of worship]\" as selling points.\n\nSTEP 3 - RETURN JSON ONLY\nDo not create a Google Doc. Do not write a legend, commentary, or summary outside the JSON.\nReply with a single json code block and nothing else. Use the field ids and the exact option labels listed below.\nText and number fields are strings. Checkbox fields are arrays of option labels. basement is \"Yes\", \"No\", or \"\".\ndate is YYYY-MM-DD when the notes give one, otherwise \"\". mls is the number, \"TBD\", or \"\".\nWhen a never-invent text or number field is unknown, use the exact text NEEDS INPUT. For every other unknown text or number, use \"\".\nWhen a checkbox field has no supported pick, use [] and add that field name to flags.\nnotes is one comprehensive paragraph of property features only (Notable Items / Features).\nflags is a short list of: assumptions you made (roof, propane leased, any other default), conflicts between notes and structured data (old vs new), every NEEDS INPUT I still owe, and any note fragments you could not read.\nKeep flags casual and tight. No em dashes. Lead with what matters.\n\nFIELD IDS AND EXACT OPTIONS\naddress (text) Property Address\nmls (text) MLS #\ndate (text) Date\nrooms (text) 28) # Rooms\nbedrooms (text) 29) # Bedrooms\nfullBaths (text) 30) # Full Baths\nhalfBaths (text) 31) # Half Baths\nlotSize (text) 32) Approx Lot Size\nyearBuilt (text) 35) Year Built\nconstruction (array, up to 2, only when yearBuilt gt 0) 36) Construction / Year Built Desc\noptions: Approximate, Historical, Renovated (When), Standing, To Be Built, Under Construction, Unknown\nstyle (array, up to 3) 38) Style of Dwelling\noptions: 1/2 Duplex, A-Frame, Bi-Level, Bungalow, Cape Cod, Carriage House, Chalet, Colonial, Contemporary, Converted Structure, Cottage, Custom Home, Detached, Development Home, Duplex, Expanded Ranch, Extra House on Lot, First Floor Unit, Fixer Upper, Hi-Rise, Lakestyle, Log Cabin, Log Home, Mediterranean, Multi-Floor Unit, One Floor Unit, Raised Ranch, Ranch, See Remarks, Split-Level, Townhouse-End Unit, Townhouse-Interior Unit, Trailer, Tudor, Victorian\nprimaryStyle (text) 39) Primary Style\nbasement (one of) 40) Basement\noptions: Yes, No\nbasementDesc (array, up to 4, only when basement eq Yes) 41) Basement Description\noptions: Bilco-Style Door, Crawl Space, Finished, Finished-Partially, French Drain, Full, Partial, Slab, Unfinished, Walkout\nroof (array, up to 2) 43) Roof Description\noptions: Asphalt Shingle, Built-Up, Composition Shingle, Fiberglass, Flat, Imitation Slate, Metal, Rubberized, See Remarks, Slate, Tile, Wood Shingle\nexterior (array, up to 4) 49) Exterior Description\noptions: Aluminum Siding, Brick, Cedar Siding, Cinder Block, Clapboard, Composition Shingle, Composition Siding, Concrete Board, Log, Metal Siding, See Remarks, Steel, Stone, Stucco - Fabricated/Masonry, Vertical Siding, Vinyl Siding, Wood, Wood Shingle\ngarageSpaces (text) 44) # Garage Spaces\ngarageDesc (array, up to 6, only when garageSpaces gt 0) 45) Garage Description\noptions: Additional 1/2 Car Garage, Assigned, Attached Garage, Built-In Garage, Carport-Attached, Carport-Detached, Detached Garage, Finished Garage, Garage Door Opener, Garage Parking, Garage Under, Inside Entrance, Loft Storage, None, On Site, On-Street Parking, Oversize Garage, Pull Down Stairs, See Remarks, Separate Location, Tandem\nparking (array, up to 6) 47) Parking / Driveway Description\noptions: 1 Car Width, 2 Car Width, Additional Parking, Assigned, Blacktop, Circular, Common, Concrete, Concrete Strip, Crushed Stone, Dirt, Driveway-Exclusive, Driveway-Shared, Fencing, Gravel, Hard Surface, Lighting, None, Non-Surfaced, Off-Street Parking, On-Street Parking, Parking Lot-Exclusive, Parking Lot-Shared, Paver Block, See Remarks\nkitchen (array, up to 5) 94) Kitchen Area\noptions: Breakfast Bar, Center Island, Country Kitchen, Eat-In Kitchen, Galley Type, Not Eat-In Kitchen, Pantry, Second Kitchen, See Remarks, Separate Dining Area\nfireplaces (text) 102) # Fireplaces\nfireplaceDesc (array, up to 6, only when fireplaces gt 0) 103) Fireplace Desc\noptions: Bathroom, Bedroom 1, Bedroom 2, Bedroom 3, Bedroom 4, Bedroom 5+, Coal, Dining Room, Family Room, Fireplace Equipment, Foyer/Hall, Gas Fireplace, Gas Ventless, Great Room, Heatolator, Imitation, Insert, Kitchen, Library, Living Room, Non-Functional, Pellet Stove, Rec Room, See Remarks, Wood Burning, Wood Stove-Freestanding\nheating (array, up to 4) 107) Heating\noptions: 1 Unit, 2 Units, 3 Units, 4+ Units, Auxiliary Electric Heat, Baseboard - Cast Iron, Baseboard - Electric, Baseboard - Hotwater, Cent Register Heat, Electric Filter, Floor/Wall Heater, Forced Hot Air, Geothermal, Heat Pump, Humidifier on Furnace, Multi-Zone, No Heat, Radiant - Electric, Radiant - Hot Water, Radiators - Hot Water, Radiators - Steam, See Remarks, Space Heater\nfuel (array, up to 3) 108) Fuel Type\noptions: Coal, Electric, Gas-Natural, Gas-Propane Leased, Gas-Propane Owned, Kerosene, None, Oil Tank Above Ground - Inside, Oil Tank Above Ground - Outside, Oil Tank Below Ground, See Remarks, Solar-Leased, Solar-Owned, Wood\ncooling (array, up to 4) 109) Cooling\noptions: 1 Unit, 2 Units, 3 Units, 4+ Units, Attic Fan, Ceiling Fan, Central Air, Ductless Split AC, Elec Air Filter, Geothermal, Heat Pump, House Exhaust Fan, Multi-Zone Cooling, No Cooling, See Remarks, Wall A/C Unit(s), Window A/C(s)\nutilities (array, up to 3) 110) Utilities\noptions: All Underground, Electric, Gas In Street, Gas-Natural, Gas-Propane, See Remarks\nwater (array, up to 3) 111) Water\noptions: Association, Private, Public Water, See Remarks, Shared Well, Water Charge Extra, Well\nsewer (array, up to 3) 113) Sewer\noptions: Association, Cesspool, Dry Well, Private, Public Available, Public Sewer, See Remarks, Septic, Septic 1 Bedroom Town Verified, Septic 2 Bedroom Town Verified, Septic 3 Bedroom Town Verified, Septic 4 Bedroom Town Verified, Septic 5+ Bedroom Town Verified, Sewer Charge Extra, Shared Sewer\nnotes (text) Notable Items / Features\n\nAGENT NOTES\nThe paste may include messy voice-to-text notes and a structured data sheet. The structured sheet wins on any conflict. Also read any photos, PDFs, or documents attached with this prompt (handwritten intake, tax record, data sheet). If there are no typed notes, use the files alone.\n---\n";

function doGet() {
  return json_({ ok: true, service: "tsc-intake-ai" });
}

function doPost(e) {
  try {
    return handlePost_(e);
  } catch (error) {
    return json_({ ok: false, error: "AI fill didn't work. Try again in a moment." });
  }
}

function handlePost_(e) {
  var raw = e && e.postData && e.postData.contents ? String(e.postData.contents) : "";
  if (raw.length > 22 * 1024 * 1024) {
    return json_({ ok: false, error: "That upload is too large. Keep files under 15 MB total." });
  }
  var body;
  try {
    body = JSON.parse(raw);
  } catch (error) {
    return json_({ ok: false, error: "The app sent something AI fill could not read." });
  }
  if (!body || typeof body !== "object") {
    return json_({ ok: false, error: "The app sent something AI fill could not read." });
  }

  var props = PropertiesService.getScriptProperties();
  var expectedSecret = props.getProperty("INTAKE_SECRET") || "";
  var apiKey = props.getProperty("GEMINI_API_KEY") || "";
  if (!expectedSecret || !apiKey) {
    return json_({ ok: false, error: "AI fill is not set up yet. Add the script properties, then try again." });
  }
  if (!sameSecret_(String(body.secret || ""), expectedSecret)) {
    return json_({ ok: false, error: "AI fill refused this request." });
  }
  var allowed = props.getProperty("ALLOWED_ORIGINS") || "https://terzene.github.io,http://127.0.0.1:8765,http://localhost:8765";
  var origin = String(body.origin || "").trim();
  var originOk = allowed.split(",").some(function (item) { return item.trim() === origin; });
  if (!originOk) {
    return json_({ ok: false, error: "AI fill refused this request." });
  }

  var notes = String(body.notes || "");
  if (notes.length > 100000) {
    return json_({ ok: false, error: "Those notes are too long. Shorten them and try again." });
  }
  var files = Array.isArray(body.files) ? body.files : [];
  if (files.length > 8) {
    return json_({ ok: false, error: "Add up to 8 files, then try again." });
  }

  var total = 0;
  var parts = [];
  var names = [];
  var extracted = [];
  for (var i = 0; i < files.length; i++) {
    var file = files[i] || {};
    var name = String(file.name || "file").slice(0, 180);
    var mime = String(file.mimeType || guessMime_(name)).toLowerCase();
    var b64 = String(file.base64 || "").replace(/\s/g, "");
    if (!b64) continue;
    total += Math.floor(b64.length * 3 / 4);
    if (total > 15 * 1024 * 1024) {
      return json_({ ok: false, error: "Those files are over 15 MB. Remove one and try again." });
    }
    names.push(name);
    if (isOldDoc_(name, mime)) {
      return json_({ ok: false, error: "Word .doc files can't be read here. Upload a PDF or a photo instead." });
    }
    if (isDocx_(name, mime)) {
      var text = extractDocx_(b64);
      if (!text) {
        return json_({ ok: false, error: "That Word file could not be read. Upload a PDF or a photo instead." });
      }
      extracted.push(name + ":\n" + text.slice(0, 60000));
      continue;
    }
    if (mime === "text/plain" || /\.txt$/i.test(name)) {
      extracted.push(name + ":\n" + Utilities.newBlob(Utilities.base64Decode(b64)).getDataAsString().slice(0, 60000));
      continue;
    }
    if (!isInline_(mime)) {
      return json_({ ok: false, error: "Upload a photo or a PDF. That file type can't be read here." });
    }
    parts.push({ inlineData: { mimeType: canonicalMime_(mime), data: b64 } });
  }

  var noteText = notes.trim();
  if (extracted.length) noteText = (noteText ? noteText + "\n\n" : "") + extracted.join("\n\n");
  if (!noteText && !names.length) return json_({ ok: false, error: "Add notes or a file first." });

  var prompt = buildPrompt_(noteText, names);
  var contentParts = [{ text: prompt }].concat(parts);
  var gemini = callGemini_(apiKey, contentParts);
  if (!gemini.ok) return json_(gemini);
  return json_({ ok: true, intake: gemini.intake });
}

function buildPrompt_(notes, fileNames) {
  var names = (fileNames || []).filter(Boolean);
  var typed = String(notes || "").trim();
  var noteBlock = typed || (names.length ? "(No typed notes. Read the attached files.)" : "");
  var files = names.length
    ? "\n\nATTACHED FILES\nThe agent is attaching these files with this prompt. Read every photo, PDF, and document, including handwriting and screenshots.\n- " + names.join("\n- ")
    : "";
  return PROMPT_PREFIX_ + noteBlock + files;
}

function callGemini_(apiKey, parts) {
  var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=" + encodeURIComponent(apiKey);
  var payload = {
    contents: [{ role: "user", parts: parts }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2
    }
  };
  var response = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  var code = response.getResponseCode();
  var text = response.getContentText() || "";
  if (code < 200 || code >= 300) {
    return { ok: false, error: "Gemini didn't answer. Try again in a moment." };
  }
  var parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return { ok: false, error: "Gemini didn't answer. Try again in a moment." };
  }
  var candidate = parsed.candidates && parsed.candidates[0];
  var part = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0];
  var answer = part && part.text ? String(part.text) : "";
  answer = answer.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  try {
    return { ok: true, intake: JSON.parse(answer) };
  } catch (error) {
    return { ok: false, error: "Gemini's answer could not be read. Try again." };
  }
}

function extractDocx_(b64) {
  try {
    var blob = Utilities.newBlob(Utilities.base64Decode(b64), "application/zip", "file.docx");
    var files = Utilities.unzip(blob);
    var xml = "";
    for (var i = 0; i < files.length; i++) {
      if (files[i].getName() === "word/document.xml") xml = files[i].getDataAsString();
    }
    if (!xml) return "";
    return xml
      .replace(/<w:p[^>]*>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, "\"")
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  } catch (error) {
    return "";
  }
}

function isDocx_(name, mime) {
  return mime.indexOf("wordprocessingml") !== -1 || /\.docx$/i.test(name);
}

function isOldDoc_(name, mime) {
  return mime === "application/msword" || (/\.doc$/i.test(name) && !/\.docx$/i.test(name));
}

function isInline_(mime) {
  return mime === "application/pdf" || mime.indexOf("image/") === 0;
}

function canonicalMime_(mime) {
  if (mime === "image/jpg") return "image/jpeg";
  return mime;
}

function guessMime_(name) {
  var lower = String(name || "").toLowerCase();
  if (/\.pdf$/.test(lower)) return "application/pdf";
  if (/\.png$/.test(lower)) return "image/png";
  if (/\.jpe?g$/.test(lower)) return "image/jpeg";
  if (/\.webp$/.test(lower)) return "image/webp";
  if (/\.gif$/.test(lower)) return "image/gif";
  if (/\.heic$/.test(lower)) return "image/heic";
  if (/\.heif$/.test(lower)) return "image/heif";
  if (/\.docx$/.test(lower)) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (/\.doc$/.test(lower)) return "application/msword";
  if (/\.txt$/.test(lower)) return "text/plain";
  return "application/octet-stream";
}

function sameSecret_(given, expected) {
  if (!given || !expected || given.length !== expected.length) return false;
  var diff = 0;
  for (var i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
