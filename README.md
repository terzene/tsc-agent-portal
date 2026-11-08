# TSC Agent Portal

Installable portal for The Sold Collective agents. It is a static site with no backend: forms, resources, and the BOLD Truths in one place, saved on the phone so the list still opens offline.

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

- **Home** opens with a greeting and the Bold Truth of the day. The Stoic quote of the day sits at the bottom of the page. Both rotate by the day of the year in America/New_York, so every agent sees the same pair. Search, pins, recent forms, and a two-column quick grid follow. Quick actions include Appt Prep, which opens the listing appointment prompt. Home Eval opens the prompt from AI Prompt Home Price Eval so you can copy it and paste it into Gemini. The original doc link stays in Resources. Dashboards (Team Pipeline and Local Market) sit under the Buyers and Listings groups.
- **Resources** groups the library into Start Here, Playbooks, Listing Tools, and Market & Pricing.
- **Team** lists Miranda Moore and Keisha Dickerson, with call, text, and email. Need help? emails team@thesoldcollective.com.
- **Search** in the bottom bar looks across forms, resources, and BOLD Truths. The full list is no longer on Home; search still finds every truth.
- The first visit can save a first name on this phone. It is not sent anywhere.
- Pin a form with the star. Pins and the last few forms you opened stay on this phone.
- The sun and moon button switches light and dark. Share sends the portal link.
- Form and resource buttons open the original link in a new tab (Safari on iPhone, Chrome on Android).
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
