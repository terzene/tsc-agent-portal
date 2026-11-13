# Listing Intake AI fill

This Apps Script reads an agent's notes and files, asks Gemini to fill the TSC Listing Intake, and returns JSON the portal can drop into the form.

The portal posts `text/plain` (so the browser skips the CORS preflight) to the web app URL:

```json
{
  "action": "fill",
  "secret": "the INTAKE_SECRET you set",
  "token": "signed session token, required once SESSION_SECRET is set",
  "origin": "https://terzene.github.io",
  "notes": "optional typed notes",
  "files": [{ "name": "kitchen.jpg", "mimeType": "image/jpeg", "base64": "..." }]
}
```

Sign-in uses the same web app. `action` is `session` with a Google ID token in `credential`, `refresh` with the current `token`, `config` to ask whether guest access is on, or `guest` with a `code` and a `device` id. All of them send `origin`. An agent session lasts 30 days. A guest session does not expire; it stops working when `GUEST_CODE` changes, because the token stores a hash of that code. Until `SESSION_SECRET` is set, fill still accepts `INTAKE_SECRET` and ignores the session. After `SESSION_SECRET` is set, fill requires a valid agent or guest session and no longer accepts the shared secret alone. Guests can use AI fill. Actions `my-day`, `my-deals`, `pace`, `leads`, and `scoreboard` require an agent session.

Photos and PDFs are sent to Gemini as files. A `.docx` is unzipped and the text is added to the notes. An old `.doc` is refused; the agent is asked for a PDF or a photo instead.

## Deploy

1. Open [script.google.com](https://script.google.com) and create a new project. Name it **TSC Listing Intake AI**.
2. Delete the starter `Code.gs` contents and paste in the `Code.gs` from this folder. In the left sidebar, click the gear (**Project Settings**). Check **Show "appsscript.json" manifest file in editor**. Open `appsscript.json` and replace it with the file from this folder.
3. Still in **Project Settings**, open **Script properties** and add:
   - `GEMINI_API_KEY` — a key from [Google AI Studio](https://aistudio.google.com/apikey)
   - `INTAKE_SECRET` — a long random string you also paste into `aiConfig.secret` in `listing-intake.js`. Used only until `SESSION_SECRET` is set.
   - `ALLOWED_ORIGINS` — optional. Defaults to `https://terzene.github.io,http://127.0.0.1:8765,http://localhost:8765`. Comma-separated, no paths.
   - `GOOGLE_CLIENT_ID` — the Web application OAuth client ID. Required for sign-in. The script checks the ID token audience against it.
   - `ALLOWED_EMAILS` — comma-separated team emails. Required for sign-in. Matching is lowercased.
   - `ADMIN_EMAILS` — optional comma-separated emails. Those sessions get `"role": "admin"`. Others on the list get `"role": "agent"`.
   - `SESSION_SECRET` — a long random string (`openssl rand -hex 32`). Keep it only in Script properties. Setting it switches AI fill over to the signed session.
   - `GUEST_CODE` — optional. A code you choose, stored only here. When it is empty, the portal hides guest access. Changing it invalidates every guest session. Wrong codes are limited to 5 tries per device per 15 minutes.
4. Click **Deploy** → **New deployment**.
5. Click the gear next to **Select type** and choose **Web app**.
6. Set **Execute as** to **Me**.
7. Set **Who has access** to **Anyone**.
8. Click **Deploy**. Approve the Google permission prompt (it needs to call the Gemini API).
9. Copy the **Web app URL** (it ends in `/exec`). Paste it into `aiConfig.url` in `listing-intake.js`, commit, and push. The portal cache must be bumped when that constant changes.

Open the `/exec` URL in a browser. You should see `{"ok":true,"service":"tsc-intake-ai","auth":true,"guest":false}`. `guest` is true only when `GUEST_CODE` is set. The response never includes the code.

The portal turns the sign-in gate on when `authConfig.clientId` and `authConfig.url` in `index.html` are both set. The steps for the Google Cloud client ID and guest access are in the portal README under **Set up Google sign-in**. Do not commit the client secret, `SESSION_SECRET`, `GUEST_CODE`, or the team email list.

To change the script later: **Deploy** → **Manage deployments** → edit → **New version** → **Deploy**. The URL stays the same.
