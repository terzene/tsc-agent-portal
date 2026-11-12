/* Listing Intake V2.
   Field labels and checkbox options match TSC Listing Intake Form V2.
   mailto is the no-backend path that opens the agent's own mail app
   already addressed to Miranda. Encoded mailto URLs past ~2000 characters
   are dropped by Chrome and are unreliable in Safari, so longer intakes
   are copied and the mail app still opens with the address and subject. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TSCIntake = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const EMAIL = "operations@thesoldcollective.com";
  const DRAFT_KEY = "tsc-portal-listing-intake";
  const PDF_TITLE = "Listing Intake Form (Fill In)";
  const GEMINI_URL = "https://gemini.google.com/app";
  const MAILTO_LIMIT = 2000;

  const OPTIONS = {
    construction: ["Approximate", "Historical", "Renovated (When)", "Standing", "To Be Built", "Under Construction", "Unknown"],
    style: ["1/2 Duplex", "A-Frame", "Bi-Level", "Bungalow", "Cape Cod", "Carriage House", "Chalet", "Colonial", "Contemporary", "Converted Structure", "Cottage", "Custom Home", "Detached", "Development Home", "Duplex", "Expanded Ranch", "Extra House on Lot", "First Floor Unit", "Fixer Upper", "Hi-Rise", "Lakestyle", "Log Cabin", "Log Home", "Mediterranean", "Multi-Floor Unit", "One Floor Unit", "Raised Ranch", "Ranch", "See Remarks", "Split-Level", "Townhouse-End Unit", "Townhouse-Interior Unit", "Trailer", "Tudor", "Victorian"],
    basement: ["Yes", "No"],
    basementDesc: ["Bilco-Style Door", "Crawl Space", "Finished", "Finished-Partially", "French Drain", "Full", "Partial", "Slab", "Unfinished", "Walkout"],
    roof: ["Asphalt Shingle", "Built-Up", "Composition Shingle", "Fiberglass", "Flat", "Imitation Slate", "Metal", "Rubberized", "See Remarks", "Slate", "Tile", "Wood Shingle"],
    garageDesc: ["Additional 1/2 Car Garage", "Assigned", "Attached Garage", "Built-In Garage", "Carport-Attached", "Carport-Detached", "Detached Garage", "Finished Garage", "Garage Door Opener", "Garage Parking", "Garage Under", "Inside Entrance", "Loft Storage", "None", "On Site", "On-Street Parking", "Oversize Garage", "Pull Down Stairs", "See Remarks", "Separate Location", "Tandem"],
    parking: ["1 Car Width", "2 Car Width", "Additional Parking", "Assigned", "Blacktop", "Circular", "Common", "Concrete", "Concrete Strip", "Crushed Stone", "Dirt", "Driveway-Exclusive", "Driveway-Shared", "Fencing", "Gravel", "Hard Surface", "Lighting", "None", "Non-Surfaced", "Off-Street Parking", "On-Street Parking", "Parking Lot-Exclusive", "Parking Lot-Shared", "Paver Block", "See Remarks"],
    exterior: ["Aluminum Siding", "Brick", "Cedar Siding", "Cinder Block", "Clapboard", "Composition Shingle", "Composition Siding", "Concrete Board", "Log", "Metal Siding", "See Remarks", "Steel", "Stone", "Stucco - Fabricated/Masonry", "Vertical Siding", "Vinyl Siding", "Wood", "Wood Shingle"],
    kitchen: ["Breakfast Bar", "Center Island", "Country Kitchen", "Eat-In Kitchen", "Galley Type", "Not Eat-In Kitchen", "Pantry", "Second Kitchen", "See Remarks", "Separate Dining Area"],
    fireplaceDesc: ["Bathroom", "Bedroom 1", "Bedroom 2", "Bedroom 3", "Bedroom 4", "Bedroom 5+", "Coal", "Dining Room", "Family Room", "Fireplace Equipment", "Foyer/Hall", "Gas Fireplace", "Gas Ventless", "Great Room", "Heatolator", "Imitation", "Insert", "Kitchen", "Library", "Living Room", "Non-Functional", "Pellet Stove", "Rec Room", "See Remarks", "Wood Burning", "Wood Stove-Freestanding"],
    heating: ["1 Unit", "2 Units", "3 Units", "4+ Units", "Auxiliary Electric Heat", "Baseboard - Cast Iron", "Baseboard - Electric", "Baseboard - Hotwater", "Cent Register Heat", "Electric Filter", "Floor/Wall Heater", "Forced Hot Air", "Geothermal", "Heat Pump", "Humidifier on Furnace", "Multi-Zone", "No Heat", "Radiant - Electric", "Radiant - Hot Water", "Radiators - Hot Water", "Radiators - Steam", "See Remarks", "Space Heater"],
    fuel: ["Coal", "Electric", "Gas-Natural", "Gas-Propane Leased", "Gas-Propane Owned", "Kerosene", "None", "Oil Tank Above Ground - Inside", "Oil Tank Above Ground - Outside", "Oil Tank Below Ground", "See Remarks", "Solar-Leased", "Solar-Owned", "Wood"],
    cooling: ["1 Unit", "2 Units", "3 Units", "4+ Units", "Attic Fan", "Ceiling Fan", "Central Air", "Ductless Split AC", "Elec Air Filter", "Geothermal", "Heat Pump", "House Exhaust Fan", "Multi-Zone Cooling", "No Cooling", "See Remarks", "Wall A/C Unit(s)", "Window A/C(s)"],
    utilities: ["All Underground", "Electric", "Gas In Street", "Gas-Natural", "Gas-Propane", "See Remarks"],
    water: ["Association", "Private", "Public Water", "See Remarks", "Shared Well", "Water Charge Extra", "Well"],
    sewer: ["Association", "Cesspool", "Dry Well", "Private", "Public Available", "Public Sewer", "See Remarks", "Septic", "Septic 1 Bedroom Town Verified", "Septic 2 Bedroom Town Verified", "Septic 3 Bedroom Town Verified", "Septic 4 Bedroom Town Verified", "Septic 5+ Bedroom Town Verified", "Sewer Charge Extra", "Shared Sewer"],
  };

  const sections = [
    {
      id: "required",
      title: "Listing",
      fields: [
        { id: "address", label: "Property Address", type: "text", required: true, placeholder: "Street, city", autocomplete: "street-address" },
        { id: "mls", label: "MLS #", type: "text", half: true, placeholder: "Number or TBD", hint: "Blank or TBD is fine for a new listing.", autocomplete: "off" },
        { id: "date", label: "Date", type: "date", required: true, half: true },
      ],
    },
    {
      id: "general",
      title: "General Information",
      fields: [
        { id: "rooms", num: 28, label: "# Rooms", type: "number", half: true },
        { id: "bedrooms", num: 29, label: "# Bedrooms", type: "number", half: true },
        { id: "fullBaths", num: 30, label: "# Full Baths", type: "number", half: true },
        { id: "halfBaths", num: 31, label: "# Half Baths", type: "number", half: true },
        { id: "lotSize", num: 32, label: "Approx Lot Size", type: "text", placeholder: "0.45 acres or 100x150" },
        { id: "yearBuilt", num: 35, label: "Year Built", type: "number", placeholder: "1998" },
      ],
    },
    {
      id: "style",
      title: "Style",
      fields: [
        { id: "construction", num: 36, label: "Construction / Year Built Desc", type: "multi", min: 1, max: 2, when: { id: "yearBuilt", op: "gt", value: 0 }, options: OPTIONS.construction, hint: "At least 1, up to 2. Shows once Year Built is filled in." },
        { id: "style", num: 38, label: "Style of Dwelling", type: "multi", min: 1, max: 3, options: OPTIONS.style, hint: "At least 1, up to 3. Write the highlight style in Primary Style." },
        { id: "primaryStyle", num: 39, label: "Primary Style", type: "text", placeholder: "Colonial", hint: "The one style you would highlight." },
      ],
    },
    {
      id: "basement",
      title: "Basement",
      fields: [
        { id: "basement", num: 40, label: "Basement", type: "single", options: OPTIONS.basement },
        { id: "basementDesc", num: 41, label: "Basement Description", type: "multi", min: 1, max: 4, when: { id: "basement", op: "eq", value: "Yes" }, options: OPTIONS.basementDesc, hint: "At least 1, up to 4." },
      ],
    },
    {
      id: "outside",
      title: "Roof and exterior",
      fields: [
        { id: "roof", num: 43, label: "Roof Description", type: "multi", min: 1, max: 2, options: OPTIONS.roof, hint: "At least 1, up to 2." },
        { id: "exterior", num: 49, label: "Exterior Description", type: "multi", min: 1, max: 4, options: OPTIONS.exterior, hint: "At least 1, up to 4." },
      ],
    },
    {
      id: "parking",
      title: "Garage and parking",
      fields: [
        { id: "garageSpaces", num: 44, label: "# Garage Spaces", type: "number" },
        { id: "garageDesc", num: 45, label: "Garage Description", type: "multi", min: 1, max: 6, when: { id: "garageSpaces", op: "gt", value: 0 }, options: OPTIONS.garageDesc, hint: "At least 1, up to 6. Shows when garage spaces is more than 0." },
        { id: "parking", num: 47, label: "Parking / Driveway Description", type: "multi", min: 1, max: 6, options: OPTIONS.parking, hint: "At least 1, up to 6." },
      ],
    },
    {
      id: "inside",
      title: "Kitchen and fireplaces",
      fields: [
        { id: "kitchen", num: 94, label: "Kitchen Area", type: "multi", min: 1, max: 5, options: OPTIONS.kitchen, hint: "At least 1, up to 5." },
        { id: "fireplaces", num: 102, label: "# Fireplaces", type: "number" },
        { id: "fireplaceDesc", num: 103, label: "Fireplace Desc", type: "multi", min: 1, max: 6, when: { id: "fireplaces", op: "gt", value: 0 }, options: OPTIONS.fireplaceDesc, hint: "At least 1, up to 6. Shows when fireplaces is more than 0." },
      ],
    },
    {
      id: "systems",
      title: "Systems",
      fields: [
        { id: "heating", num: 107, label: "Heating", type: "multi", min: 1, max: 4, options: OPTIONS.heating, hint: "At least 1, up to 4." },
        { id: "fuel", num: 108, label: "Fuel Type", type: "multi", min: 1, max: 3, options: OPTIONS.fuel, hint: "At least 1, up to 3." },
        { id: "cooling", num: 109, label: "Cooling", type: "multi", min: 1, max: 4, options: OPTIONS.cooling, hint: "At least 1, up to 4." },
        { id: "utilities", num: 110, label: "Utilities", type: "multi", min: 1, max: 3, options: OPTIONS.utilities, hint: "At least 1, up to 3." },
        { id: "water", num: 111, label: "Water", type: "multi", min: 1, max: 3, options: OPTIONS.water, hint: "At least 1, up to 3." },
        { id: "sewer", num: 113, label: "Sewer", type: "multi", min: 1, max: 3, options: OPTIONS.sewer, hint: "At least 1, up to 3." },
      ],
    },
    {
      id: "notes",
      title: "Notable Items / Features",
      fields: [
        { id: "notes", label: "Notable Items / Features", type: "notes", placeholder: "Upgrades, views, land, unique selling points. A few sentences. Optional.", hint: "Optional. Describe the property and its features only." },
      ],
    },
  ];

  const fields = sections.reduce(function (list, section) {
    return list.concat(section.fields);
  }, []);

  const byId = {};
  fields.forEach(function (field) {
    byId[field.id] = field;
  });

  const keyIndex = new Map();
  fields.forEach(function (field) {
    [field.id, field.label, field.num ? String(field.num) : "", field.num ? field.num + " " + field.label : ""].forEach(function (key) {
      const norm = normKey(key);
      if (norm) keyIndex.set(norm, field);
    });
  });

  function allFields() {
    return fields.slice();
  }

  function today(now) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now || new Date());
    const get = function (type) {
      return parts.find(function (part) { return part.type === type; }).value;
    };
    return get("year") + "-" + get("month") + "-" + get("day");
  }

  function emptyValues(day) {
    const values = {};
    fields.forEach(function (field) {
      if (field.type === "multi") values[field.id] = [];
      else if (field.type === "date") values[field.id] = day || today();
      else values[field.id] = "";
    });
    return values;
  }

  function emptyDraft(day) {
    return { values: emptyValues(day), rawNotes: "", aiPaste: "" };
  }

  function normalizeDraft(raw, day) {
    const values = emptyValues(day);
    const source = raw && raw.values && typeof raw.values === "object" ? raw.values : {};
    fields.forEach(function (field) {
      values[field.id] = coerceStored(field, source[field.id], day);
    });
    return {
      values: values,
      rawNotes: raw && typeof raw.rawNotes === "string" ? raw.rawNotes : "",
      aiPaste: raw && typeof raw.aiPaste === "string" ? raw.aiPaste : "",
    };
  }

  function coerceStored(field, incoming, day) {
    if (field.type === "multi") {
      const list = Array.isArray(incoming) ? incoming : [];
      return list.filter(function (item) { return field.options.indexOf(item) !== -1; }).slice(0, field.max || list.length);
    }
    if (field.type === "single") return field.options.indexOf(incoming) !== -1 ? incoming : "";
    if (field.type === "date") return isIsoDate(incoming) ? incoming : (day || today());
    if (field.type === "number") return isNumberText(incoming) ? String(incoming).trim() : "";
    return cleanText(incoming);
  }

  function isVisible(field, values) {
    if (!field.when) return true;
    const current = values[field.when.id];
    if (field.when.op === "eq") return current === field.when.value;
    if (field.when.op === "gt") return numberValue(current) > field.when.value;
    return true;
  }

  function validate(values) {
    const errors = {};
    if (!cleanText(values.address)) errors.address = "Add the property address.";
    if (!isIsoDate(cleanText(values.date))) errors.date = "Add the date.";
    fields.forEach(function (field) {
      if (!isVisible(field, values)) return;
      if (field.type === "number" && cleanText(values[field.id]) && !isNumberText(values[field.id])) {
        errors[field.id] = "Use a number.";
      }
      if (field.type === "multi") {
        const count = (values[field.id] || []).length;
        if (field.min && count < field.min) errors[field.id] = "Pick at least one.";
        else if (field.max && count > field.max) errors[field.id] = "Pick no more than " + field.max + ".";
      }
    });
    return errors;
  }

  function summary(values) {
    const address = cleanText(values.address);
    const subject = address ? "Listing Intake \u2013 " + address : "Listing Intake";
    const lines = [
      "TSC Listing Intake",
      "",
      "Property Address: " + address,
      "MLS #: " + (cleanText(values.mls) || "TBD"),
      "Date: " + formatLongDate(cleanText(values.date)),
      "",
    ];
    fields.filter(function (field) { return field.num; }).sort(function (a, b) { return a.num - b.num; }).forEach(function (field) {
      if (!isVisible(field, values)) return;
      const printed = formatValue(field, values);
      if (!printed) return;
      lines.push(field.num + ") " + field.label + ": " + printed);
    });
    const notes = cleanText(values.notes);
    if (notes) lines.push("", "Notable Items / Features:", notes);
    return { subject: subject, body: lines.join("\n") };
  }

  function formatValue(field, values) {
    if (field.type === "multi") return (values[field.id] || []).join(", ");
    return cleanText(values[field.id]);
  }

  function mailtoHref(subject, body) {
    return "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }

  function fitMailto(subject, body) {
    const full = mailtoHref(subject, body);
    if (full.length <= MAILTO_LIMIT) return { href: full, truncated: false, body: body };
    const header = body.split("\n").slice(0, 6).join("\n");
    const note = "The rest of this listing intake is copied to the clipboard. Paste it here, then send.";
    let href = mailtoHref(subject, header + "\n\n" + note);
    if (href.length > MAILTO_LIMIT) href = mailtoHref(trimSubject(subject), note);
    if (href.length > MAILTO_LIMIT) href = mailtoHref("Listing Intake", note);
    return { href: href, truncated: true, body: body };
  }

  function trimSubject(subject) {
    return subject.length > 90 ? subject.slice(0, 87) + "..." : subject;
  }

  function promptBody(notes, fileNames) {
    const names = Array.isArray(fileNames) ? fileNames.map(function (name) { return String(name || "").trim(); }).filter(Boolean) : [];
    const typed = String(notes || "").replace(/^\s+|\s+$/g, "");
    const noteBlock = typed || (names.length ? "(No typed notes. Read the attached files.)" : "");
    const files = names.length
      ? "\n\nATTACHED FILES\nThe agent is attaching these files with this prompt. Read every photo, PDF, and document, including handwriting and screenshots.\n- " + names.join("\n- ")
      : "";
    return INSTRUCTIONS + "\n" + catalog() + "\n\nAGENT NOTES\nThe paste may include messy voice-to-text notes and a structured data sheet. The structured sheet wins on any conflict. Also read any photos, PDFs, or documents attached with this prompt (handwritten intake, tax record, data sheet). If there are no typed notes, use the files alone.\n---\n" + noteBlock + files;
  }

  function parse(text, current, day) {
    const found = extractJson(text);
    if (!found) return { ok: false, values: current, needs: {}, review: [] };
    const values = {};
    fields.forEach(function (field) {
      values[field.id] = Array.isArray(current[field.id]) ? current[field.id].slice() : current[field.id];
    });
    const needs = {};
    const review = [];
    const seen = {};
    Object.keys(found).forEach(function (key) {
      if (normKey(key) === "flags" || normKey(key) === "flag") return;
      const field = keyIndex.get(normKey(key));
      if (!field || seen[field.id]) return;
      seen[field.id] = true;
      values[field.id] = applyIncoming(field, found[key], values[field.id], day || today(), needs, review);
    });
    asFlags(found.flags != null ? found.flags : found.flag).forEach(function (line) {
      review.push(line);
    });
    const needNames = Object.keys(needs).map(function (id) { return byId[id].label; });
    if (needNames.length) review.unshift("Check the highlighted fields: " + needNames.join(", ") + ".");
    return { ok: true, values: values, needs: needs, review: review };
  }

  function applyIncoming(field, raw, current, day, needs, review) {
    if (field.type === "multi" || field.type === "single") return applyChoices(field, raw, needs, review);
    if (raw == null) return current;
    let text = Array.isArray(raw) ? raw.map(function (item) { return String(item); }).join(", ") : String(raw);
    text = text.trim();
    if (!text) return field.type === "date" ? current || day : "";
    if (normKey(text) === "needsinput") {
      if (field.id === "mls") {
        review.push("MLS # was left blank. Blank or TBD is fine for a new listing.");
        return "";
      }
      if (field.id === "date") {
        review.push("Date was left for you. Today is filled in. Change it if this listing needs a different date.");
        return isIsoDate(current) ? current : day;
      }
      needs[field.id] = "Still needs an answer. AI marked it NEEDS INPUT.";
      return "";
    }
    if (field.type === "number") {
      const numeric = text.replace(/,/g, "");
      if (!isNumberText(numeric)) {
        needs[field.id] = "AI sent \u201c" + text + "\u201d, which is not a number. Type the number.";
        return "";
      }
      return String(Number(numeric));
    }
    if (field.type === "date") {
      const iso = parseDate(text, day);
      if (!iso) {
        needs[field.id] = "AI sent \u201c" + text + "\u201d for the date. Today is filled in. Change it if you need to.";
        review.push("Could not read the date \u201c" + text + "\u201d. Today is filled in.");
        return isIsoDate(current) ? current : day;
      }
      return iso;
    }
    return text;
  }

  function applyChoices(field, raw, needs, review) {
    const items = asList(raw);
    const picked = [];
    const skipped = [];
    let needsInput = false;
    items.forEach(function (item) {
      if (normKey(item) === "needsinput") {
        needsInput = true;
        return;
      }
      const match = findOption(field, item);
      if (!match) {
        if (String(item).trim()) skipped.push(String(item).trim());
        return;
      }
      if (picked.indexOf(match) === -1) picked.push(match);
    });
    const dropped = [];
    const max = field.max || picked.length;
    while (picked.length > max) dropped.push(picked.pop());
    if (field.type === "single") {
      if (picked.length > 1) {
        review.push(field.label + ": kept " + picked[0] + " and dropped " + picked.slice(1).join(", ") + ".");
      }
      if (skipped.length) review.push(field.label + ": skipped " + skipped.join(", ") + ".");
      if (needsInput && !picked.length) needs[field.id] = "Still needs an answer. AI marked it NEEDS INPUT.";
      return picked[0] || "";
    }
    if (skipped.length) review.push(field.label + ": skipped " + skipped.join(", ") + ".");
    if (dropped.length) review.push(field.label + ": kept " + max + " and dropped " + dropped.join(", ") + ".");
    if (needsInput && !picked.length) needs[field.id] = "Still needs a pick. AI marked it NEEDS INPUT.";
    else if (needsInput || skipped.length || dropped.length) needs[field.id] = "Check these picks. Something AI sent did not fit.";
    return picked;
  }

  function findOption(field, item) {
    if (!field.options) return null;
    const want = normOption(item);
    const wantBare = bareOption(want);
    let found = field.options.find(function (opt) { return normOption(opt) === want; });
    if (found) return found;
    found = field.options.find(function (opt) { return bareOption(normOption(opt)) === wantBare; });
    if (found) return found;
    return field.options.find(function (opt) {
      const name = bareOption(normOption(opt));
      return name + "s" === wantBare || name === wantBare + "s";
    }) || null;
  }

  function catalog() {
    return fields.map(function (field) {
      const num = field.num ? field.num + ") " : "";
      if (field.type === "multi" || field.type === "single") {
        const kind = field.type === "single" ? "one of" : "array, up to " + field.max;
        const rule = field.when ? ", only when " + field.when.id + " " + field.when.op + " " + field.when.value : "";
        return field.id + " (" + kind + rule + ") " + num + field.label + "\noptions: " + field.options.join(", ");
      }
      return field.id + " (text) " + num + field.label;
    }).join("\n");
  }

  function extractJson(text) {
    const raw = String(text || "").replace(/^\uFEFF/, "").trim();
    if (!raw) return null;
    const fence = /```(?:json)?\s*([\s\S]*?)```/gi;
    let match;
    let parsed = null;
    while ((match = fence.exec(raw))) {
      parsed = tryParse(match[1]) || parsed;
    }
    if (isObject(parsed)) return parsed;
    parsed = tryParse(raw);
    if (isObject(parsed)) return parsed;
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      parsed = tryParse(raw.slice(start, end + 1));
      if (isObject(parsed)) return parsed;
    }
    return null;
  }

  function tryParse(text) {
    try {
      return JSON.parse(String(text).trim().replace(/,\s*([}\]])/g, "$1"));
    } catch (error) {
      return null;
    }
  }

  function asList(value) {
    if (Array.isArray(value)) return value.flatMap(asList);
    if (value == null) return [];
    if (typeof value === "boolean") return [value ? "Yes" : "No"];
    const text = String(value).trim();
    if (!text) return [];
    if (text.charAt(0) === "[") {
      const parsed = tryParse(text);
      if (Array.isArray(parsed)) return asList(parsed);
    }
    return text.split(/\s+\.\s+|\n+|\s+\|\s+|\s+;\s+|;\s*|\s+and\s+|,\s*/i).map(function (part) {
      return part.trim();
    }).filter(Boolean);
  }

  function asFlags(value) {
    if (Array.isArray(value)) return value.flatMap(asFlags);
    if (value == null || value === "") return [];
    return String(value).split(/\n+/).map(function (line) {
      return line.replace(/^[\s*\-•\d.)]+/, "").trim();
    }).filter(Boolean);
  }

  function isObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function normKey(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  }

  function normOption(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/\s+/g, " ")
      .replace(/\s*-\s*/g, "-")
      .replace(/\s*\/\s*/g, "/")
      .trim();
  }

  function bareOption(value) {
    return value.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  }

  function cleanText(value) {
    const text = String(value == null ? "" : value).trim();
    return normKey(text) === "needsinput" ? "" : text;
  }

  function isNumberText(value) {
    return /^\d+(\.\d+)?$/.test(String(value == null ? "" : value).trim());
  }

  function numberValue(value) {
    if (!isNumberText(value)) return NaN;
    return Number(String(value).trim());
  }

  function isIsoDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
    if (!match) return false;
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    return date.getUTCFullYear() === Number(match[1]) && date.getUTCMonth() === Number(match[2]) - 1 && date.getUTCDate() === Number(match[3]);
  }

  function parseDate(text, day) {
    const value = String(text || "").trim();
    if (isIsoDate(value)) return value;
    if (normKey(value) === "today") return day;
    const us = value.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (us) {
      const year = us[3].length === 2 ? 2000 + Number(us[3]) : Number(us[3]);
      const iso = String(year) + "-" + pad(us[1]) + "-" + pad(us[2]);
      if (isIsoDate(iso)) return iso;
    }
    const named = value.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
    if (named && MONTHS[named[1].toLowerCase()]) {
      const iso = named[3] + "-" + pad(MONTHS[named[1].toLowerCase()]) + "-" + pad(named[2]);
      if (isIsoDate(iso)) return iso;
    }
    return "";
  }

  function formatLongDate(iso) {
    if (!isIsoDate(iso)) return iso || "";
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function draftHasContent(draft, day) {
    if (draft.rawNotes.trim() || draft.aiPaste.trim()) return true;
    return fields.some(function (field) {
      if (field.type === "date") return cleanText(draft.values[field.id]) && draft.values[field.id] !== day;
      if (field.type === "multi") return (draft.values[field.id] || []).length > 0;
      return !!cleanText(draft.values[field.id]);
    });
  }

  const MONTHS = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12, jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };

  const EXTRA_ALIASES = {
    propertyaddress: "address",
    mlsnumber: "mls",
    mlsno: "mls",
    listingdate: "date",
    approxlotsize: "lotSize",
    lotsize: "lotSize",
    fullbathrooms: "fullBaths",
    halfbathrooms: "halfBaths",
    dwellingstyle: "style",
    styleofdwelling: "style",
    constructionyearbuiltdesc: "construction",
    yearbuiltdesc: "construction",
    basementdescription: "basementDesc",
    roofdescription: "roof",
    garagedescription: "garageDesc",
    numberofgaragespaces: "garageSpaces",
    parkingdriveway: "parking",
    parkingdrivewaydescription: "parking",
    exteriordescription: "exterior",
    siding: "exterior",
    kitchenarea: "kitchen",
    numberoffireplaces: "fireplaces",
    fireplacedescription: "fireplaceDesc",
    fueltype: "fuel",
    notableitems: "notes",
    notableitemsfeatures: "notes",
    features: "notes",
  };

  Object.keys(EXTRA_ALIASES).forEach(function (alias) {
    if (byId[EXTRA_ALIASES[alias]]) keyIndex.set(alias, byId[EXTRA_ALIASES[alias]]);
  });

  const INSTRUCTIONS = [
    "Turn my raw listing notes into field values for the TSC Listing Intake form. My notes are often voice-to-text and come in garbled. I may also paste a clean structured data sheet (specs, taxes, comps).",
    "",
    "STEP 1 - READ THE NOTES",
    "- Decode obvious voice-to-text errors (e.g. \"Faced fat air\" = forced hot air, \"never W/D\" = newer washer and dryer, \"septic getting pumped\" = septic).",
    "- If a fragment can't be decoded confidently, leave it out and list it in flags.",
    "- I may attach photos, PDFs, or documents (a handwritten intake, a reMarkable page, a tax record, or a data sheet). Read them. They count as notes.",
    "- If I provide BOTH messy notes and a structured data sheet or file, the structured sheet or file wins on any conflict but put the messy notes info in notes. Call out every conflict explicitly in flags (old value vs new value).",
    "",
    "STEP 2 - FILL THE FORM",
    "Fill only what the notes or data support. For these fields, NEVER invent a value. If it isn't explicitly given, mark NEEDS INPUT:",
    "- Style of Dwelling (style) and Primary Style (primaryStyle)",
    "- Exterior / siding material (exterior)",
    "- Kitchen area type (kitchen)",
    "- Garage space count (garageSpaces)",
    "- Propane or solar leased vs owned (do not pick Gas-Propane Leased, Gas-Propane Owned, Solar-Leased, or Solar-Owned unless the notes say which)",
    "Two allowed judgment calls, but you MUST list them in flags:",
    "- Roof: if only age is given, default to Asphalt Shingle (regional norm).",
    "- \"Leased\" in notes maps to propane, since that's the only fuel with a leased/owned split. Use Gas-Propane Leased and say so in flags.",
    "Apply Fair Housing to the notes text: describe the property and its features only. No references to people, family status, demographics, religion, \"safe,\" schools or \"walking distance to [place of worship]\" as selling points.",
    "",
    "STEP 3 - RETURN JSON ONLY",
    "Do not create a Google Doc. Do not write a legend, commentary, or summary outside the JSON.",
    "Reply with a single json code block and nothing else. Use the field ids and the exact option labels listed below.",
    "Text and number fields are strings. Checkbox fields are arrays of option labels. basement is \"Yes\", \"No\", or \"\".",
    "date is YYYY-MM-DD when the notes give one, otherwise \"\". mls is the number, \"TBD\", or \"\".",
    "When a never-invent text or number field is unknown, use the exact text NEEDS INPUT. For every other unknown text or number, use \"\".",
    "When a checkbox field has no supported pick, use [] and add that field name to flags.",
    "notes is one comprehensive paragraph of property features only (Notable Items / Features).",
    "flags is a short list of: assumptions you made (roof, propane leased, any other default), conflicts between notes and structured data (old vs new), every NEEDS INPUT I still owe, and any note fragments you could not read.",
    "Keep flags casual and tight. No em dashes. Lead with what matters.",
    "",
    "FIELD IDS AND EXACT OPTIONS",
  ].join("\n");

  return {
    EMAIL: EMAIL,
    DRAFT_KEY: DRAFT_KEY,
    PDF_TITLE: PDF_TITLE,
    GEMINI_URL: GEMINI_URL,
    MAILTO_LIMIT: MAILTO_LIMIT,
    sections: sections,
    fields: fields,
    today: today,
    emptyDraft: emptyDraft,
    normalizeDraft: normalizeDraft,
    draftHasContent: draftHasContent,
    isVisible: isVisible,
    validate: validate,
    summary: summary,
    fitMailto: fitMailto,
    promptBody: promptBody,
    parse: parse,
    cleanText: cleanText,
  };
});
