YING VERSION 6 — BOTH BRAINS, LOCAL MEMORY

WHAT'S NEW FROM V5
- Two response paths: a small local/offline starter brain, plus an optional online model through a secure backend.
- Local memories stay in this browser's localStorage by default.
- Memory export/import lets you move memories between devices manually.
- Memory sharing with the online model is OFF by default and must be enabled separately.
- Mood/personality state is saved locally.
- The exact V5 avatar crop and original reference sheet are reused unchanged.

HONEST LIMITATIONS
- The offline brain is a small rule-based fallback, not a full neural model. It cannot match a trained conversational model.
- Online mode requires a separately hosted backend and an AI provider account.
- Never paste an API key into this website. Keep it as a backend secret.
- The PWA can listen only after you press Listen once, while the page is open. It does not secretly or continuously listen in the background.
- Browser speech recognition availability varies. HTTPS and microphone permission are required.
- A web app cannot freely control Android, read all notifications, block people, or run a permanent microphone service.
- Simulated emotions are not evidence of consciousness or actual human feelings.

HOSTING THE WEB APP
1. Extract this ZIP on the Chromebook.
2. Upload the contents of this folder to a hosting service that serves static files over HTTPS.
3. Open the HTTPS site in Chrome on your TCL Android phone.
4. Use Chrome's menu > Install app / Add to Home screen, if offered.
5. Grant microphone permission only when you want to use voice.

OPTIONAL ONLINE BRAIN BACKEND
worker.js is an optional Cloudflare Worker adapter for an OpenAI-compatible chat-completions endpoint.
1. Create a Worker in the provider's dashboard and paste worker.js.
2. Add Worker variables/secrets:
   - AI_API_URL: the provider's full chat-completions endpoint URL
   - AI_API_KEY: secret API key (secret, not plain text variable)
   - AI_MODEL: model identifier supported by your provider
   - ALLOWED_ORIGIN: exact HTTPS origin where your Ying web app is hosted, e.g. https://your-site.example
3. Deploy the Worker.
4. In Ying > Brain settings, enable online brain and paste the Worker URL ending in /chat only if your Worker route is configured that way. If your Worker is deployed at the root, change the endpoint in app settings to its root URL or add a /chat route in your Worker configuration.
5. Keep "Allow selected saved memories..." OFF unless you explicitly want those selected memory snippets sent to the online provider.

SECURITY
- Do not publish private API keys, passwords, personal details, or private conversations in a public repository.
- Static hosting repositories may be publicly readable. Upload only app files and artwork you are comfortable publishing.
- Local browser storage is not encrypted and can be erased by clearing browser data. Export a backup if you want to preserve memories.
- The app does not automatically sync memories. Export from one device and import on the other.

NEXT STEP FOR A TRUE NATIVE ANDROID VERSION
A native Android app is needed for a properly implemented foreground microphone service, Android notification-listener permission, and approved phone integrations. This ZIP is the local-first PWA foundation and does not claim to provide those native powers.
