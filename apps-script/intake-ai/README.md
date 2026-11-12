# Listing Intake AI fill

This Apps Script reads an agent's notes and files, asks Gemini to fill the TSC Listing Intake, and returns JSON the portal can drop into the form.

The portal posts `text/plain` (so the browser skips the CORS preflight) to the web app URL:

```json
{
  "secret": "the INTAKE_SECRET you set",
  "origin": "https://terzene.github.io",
  "notes": "optional typed notes",
  "files": [{ "name": "kitchen.jpg", "mimeType": "image/jpeg", "base64": "..." }]
}
```

Photos and PDFs are sent to Gemini as files. A `.docx` is unzipped and the text is added to the notes. An old `.doc` is refused; the agent is asked for a PDF or a photo instead.

## Deploy

1. Open [script.google.com](https://script.google.com) and create a new project. Name it **TSC Listing Intake AI**.
2. Delete the starter `Code.gs` contents and paste in the `Code.gs` from this folder. In the left sidebar, click the gear (**Project Settings**). Check **Show "appsscript.json" manifest file in editor**. Open `appsscript.json` and replace it with the file from this folder.
3. Still in **Project Settings**, open **Script properties** and add:
   - `GEMINI_API_KEY` — a key from [Google AI Studio](https://aistudio.google.com/apikey)
   - `INTAKE_SECRET` — a long random string you also paste into `aiConfig.secret` in `listing-intake.js`
   - `ALLOWED_ORIGINS` — optional. Defaults to `https://terzene.github.io,http://127.0.0.1:8765,http://localhost:8765`. Comma-separated, no paths.
4. Click **Deploy** → **New deployment**.
5. Click the gear next to **Select type** and choose **Web app**.
6. Set **Execute as** to **Me**.
7. Set **Who has access** to **Anyone**.
8. Click **Deploy**. Approve the Google permission prompt (it needs to call the Gemini API).
9. Copy the **Web app URL** (it ends in `/exec`). Paste it into `aiConfig.url` in `listing-intake.js`, commit, and push. The portal cache must be bumped when that constant changes.

Open the `/exec` URL in a browser. You should see `{"ok":true,"service":"tsc-intake-ai"}`.

To change the script later: **Deploy** → **Manage deployments** → edit → **New version** → **Deploy**. The URL stays the same.
