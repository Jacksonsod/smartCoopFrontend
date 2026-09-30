# Phase D3: add investor token issue and revoke page

Adds `/investor-tokens` for SUPER_ADMIN, with localized issue and direct-ID revoke forms. Uses the confirmed camelCase DTO fields (`cooperativeId`, `expiresAt`). Full transaction access requires a cooperative ID because the actual service rejects a missing one. The raw token is held only in component state, displayed once with its ID and a copy warning, and is discarded on dismissal/navigation. Revocation requires confirmation.

**Stopgap:** no token-list endpoint exists. Administrators must record the issued ID and enter it to revoke later. This PR does not add browser storage for tokens or invent a list endpoint.

Validation: production build passed. COOP_ADMIN navigation to this route was denied. A real SUPER_ADMIN issue submission returned 404 and the localized failure state displayed. No token was issued.

**Blocked live acceptance:** issuance, clipboard, navigation clearing and revocation require the existing investor controller to be available on the running backend. Retest both scopes and revoke every issued test token.

Reproduce: SUPER_ADMIN → Investor tokens → label/scope/expiry → Issue; record ID and copy token, navigate away and back, confirm raw token is gone, then revoke using the recorded ID.

All new UI text is in react-i18next English, Kinyarwanda and French locale keys. No backend or mobile source was changed. Each branch starts independently from `9d462f6d`; none requires another Phase D PR. The shared layout gets `min-w-0` so content can shrink on mobile; sidebar Sheet behavior is unchanged. The pre-existing header still extends about 26px past a 390px viewport and is outside these feature changes.

Verification used the supplied local test accounts and `http://localhost:8089`. Synthetic test records described above remain as verification fixtures. Existing bundle-size warnings remain; builds have zero errors.


### Live evidence

![after](after.png)

![before](before.png)
