# TSC Agent Portal

Installable portal for The Sold Collective agents. It is a static site: forms, resources, and the BOLD Truths in one place, saved on the phone so the list still opens offline. Google sign-in and Listing Intake AI fill use an Apps Script when they are configured. The sign-in gate stays off until a Google client ID and auth URL are both set, so the portal does not lock anyone out before that setup.

After GitHub Pages is enabled, the site is [https://terzene.github.io/tsc-agent-portal/](https://terzene.github.io/tsc-agent-portal/).

The home-screen name is **TSC Portal**. The full name is **TSC Agent Portal**.

## Install on iPhone (Safari)

iPhone only installs this app from Safari. Chrome on iPhone cannot add it to the home screen.

1. Open [https://terzene.github.io/tsc-agent-portal/](https://terzene.github.io/tsc-agent-portal/) in Safari.
2. Tap the **Share** button (the square with the arrow).
3. Scroll the share sheet and tap **Add to Home Screen**.
4. Leave the name as **TSC Portal** and tap **Add**.
5. Open **TSC Portal** from the home screen. It launches on its own, without the Safari address bar.

## Install on Android (Chrome)

1. Open [https://terzene.github.io/tsc-agent-portal/](https://terzene.github.io/tsc-agent-portal/) in Chrome.
2. Tap **Install app** on the banner, or the install icon in the address bar. If you do not see those, open the Chrome menu (three dots) and tap **Install app** or **Add to Home screen**.
3. Confirm. The icon is labeled **TSC Portal**.
4. Open it from the home screen or the app drawer. It runs as its own app.

## Use the portal

- **Home** opens with a greeting and the Bold Truth of the day. The Stoic quote of the day sits at the bottom of the page. Both rotate by the day of the year in America/New_York, so every agent sees the same pair. Search, pins, recent forms, and quick actions follow. Quick actions stay a two-column grid, split into Forms and AI Prompts. Forms starts with Listing Intake, which opens in the app: add notes or a photo or file, fill the form, and send it to Miranda at operations@thesoldcollective.com. A draft stays on the phone. You can also fill the blank form yourself. AI Prompts holds Home Eval, Quick Comps, Local Market, and Appt Prep. Appt Prep opens the prompt from AI Prompt Listing Appt Prep so you can copy it and paste it into Gemini, and Home Eval opens the prompt from AI Prompt Home Price Eval the same way. Those sheets tell you to use the newest, most capable model with thinking or extended reasoning turned on, and that line is the first line of the copied prompt. The original doc links stay in Resources. Dashboards (Team Pipeline and Local Market) sit under the Buyers and Listings groups.
- **Resources** groups the library into Start Here, Playbooks, Listing Tools, and Market & Pricing. In Listing Tools, Listing Intake Form opens the in-app form. The fill-in PDF stays on that same row.
- **Team** lists Miranda Moore and Keisha Dickerson, with call, text, and email. Need help? emails team@thesoldcollective.com.
- **Search** in the bottom bar looks across forms, resources, and BOLD Truths. The full list is no longer on Home; search still finds every truth.
- The first visit can save a first name on this phone. It is not sent anywhere.
- Pin a form with the star. Pins and the last few forms you opened stay on this phone.
- The sun and moon button switches light and dark. Share sends the portal link.
- Most form and resource buttons open the original link in a new tab (Safari on iPhone, Chrome on Android). Listing Intake opens in the app.
- BOLD Truths stay in the app. They are statements, not links.
- After one online visit, the app shell opens with no connection. Pull to refresh when you are back online. Opening a form or file still needs the network.

## Edit links

All links and the BOLD Truths live in [`data/portal.json`](data/portal.json). The Stoic quotes live in [`data/stoic-quotes.json`](data/stoic-quotes.json).

1. Edit that file.
2. Commit to `main` and push.
3. The GitHub Actions workflow republishes the site.

Change a title or URL on the existing object. To add a row, copy an object in `forms` or `resources` and replace `title` and `url`. Use the exact `https://` URL. Do not put links in `index.html` or `app.js`.

Each form and resource is an object with `title` and `url`. Each BOLD Truth is a string in `boldTruths`. `siteColors` is four hex colors: accent, white, black, card. Copy an existing object when you add a row, and keep every `url` exactly as it was given to you.

`siteColors` is accent, white, black, then the card color. Those four values recolor the page. Home-screen icons are the PNG files in `icons/`.

The header logo is [`assets/wordmark.png`](assets/wordmark.png), a local copy of the wordmark in `logoUrls`, so the shell still looks right offline.

Paths in the site are relative (`manifest.json`, `sw.js`, `data/portal.json`) so the same files work at the project path `/tsc-agent-portal/` on GitHub Pages.

## Enable GitHub Pages

A repo admin does this once. The workflow cannot publish until it is set.

1. Open the repository **Settings**.
2. Click **Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.

Pushing to `main` (or re-running **Deploy to GitHub Pages** from the Actions tab) then publishes [https://terzene.github.io/tsc-agent-portal/](https://terzene.github.io/tsc-agent-portal/).

The live URL needs the trailing slash.

## Set up Google sign-in

Sign-in locks the portal to the team list in the Apps Script property `ALLOWED_EMAILS`. Until you finish the steps below, leave `authConfig.clientId` empty in `index.html`. An empty client ID keeps the gate off.

### Create the OAuth client ID

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project, or pick the project you want to use. Name it **TSC Agent Portal**.
3. Open **APIs & Services** → **OAuth consent screen**.
4. Choose **External**, then create the app. App name: **TSC Portal**. Use your own Google account as the user support email. The scopes Google Sign-In requests are openid, email, and profile.
5. If the consent screen stays in **Testing**, only listed test users can sign in, and Google expires those grants after 7 days. Choose **Publish app** so the whole team can sign in. These basic scopes do not need a Google verification review.
6. Open **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**.
7. Application type: **Web application**.
8. Name: **TSC Agent Portal**.
9. Under **Authorized JavaScript origins**, add `https://terzene.github.io`. Do not add a path. Leave **Authorized redirect URIs** empty. The Sign in with Google button does not use a redirect.
10. Click **Create** and copy the client ID. It ends in `.apps.googleusercontent.com`.

### Script properties and deploy

The auth endpoint lives in [`apps-script/intake-ai/Code.gs`](apps-script/intake-ai/Code.gs), the same web app as Listing Intake AI fill.

1. Paste the updated `Code.gs` into the Apps Script project. **Deploy** → **Manage deployments** → pencil → **New version** → **Deploy**. The `/exec` URL stays the same.
2. In **Project Settings** → **Script properties**, set:
   - `GOOGLE_CLIENT_ID` — the same client ID from the step above. The script checks the Google ID token's audience against this value.
   - `ALLOWED_EMAILS` — comma-separated team emails. Matching is case-insensitive. Example shape: `one@example.com, two@example.com`. An empty list lets nobody in.
   - `ADMIN_EMAILS` — optional. Same comma-separated shape. Those accounts get `"role": "admin"` on the session. Everyone else on the list gets `"role": "agent"`.
   - `SESSION_SECRET` — a long random string. Create it locally with `openssl rand -hex 32` and paste it only into Script properties. Do not commit it. Once this is set, AI fill requires a signed-in session and no longer accepts `INTAKE_SECRET` alone. Until it is set, AI fill keeps using `INTAKE_SECRET`.
3. In `index.html`, set both fields in the head script:

```js
var authConfig = { clientId: "YOUR_CLIENT_ID.apps.googleusercontent.com", url: "https://script.google.com/macros/s/YOUR_DEPLOYMENT/exec" };
```

`url` is the web app `/exec` URL. The gate turns on only when `clientId` and `url` are both non-empty.
4. Bump the `CACHE` string in `sw.js` by one so installed copies pick up the sign-in page, then commit and push.

A signed-in agent gets a session token that lasts 30 days. Opening the portal online renews it. If they were already signed in and the phone is offline, the saved session still lets them in until it expires. Sign out is in the bottom menu on a phone and at the bottom of the sidebar on a desktop. An account that is not on `ALLOWED_EMAILS` sees: "This account isn't on the TSC team list. Ask Miranda for access."

### Guest access

Leave `GUEST_CODE` unset and the sign-in page does not offer a guest code. Do not commit the code.

1. Choose a code and store it only in the Script property `GUEST_CODE`.
2. Deploy a new version of the script.
3. **Have a guest code?** shows under Sign in with Google only when that property is set. The script compares the code in constant time. Five wrong tries on one device within 15 minutes are refused. A shared ceiling also stops someone from getting unlimited tries by changing the device id. Apps Script does not receive the caller's IP address, so the limit is kept in CacheService this way.
4. A guest session does not expire. It stays valid until Sign out, or until `GUEST_CODE` changes. Each guest token carries a hash of the current code, so the old token stops working when the code changes.
5. Guests can use the portal, including forms, resources, Bold Truths, the Stoic quote, and Listing Intake AI fill. They do not get agent-specific data: My Day, My Deals, pace, leads, or a scoreboard. A Guest badge sits in the header next to Sign out.
