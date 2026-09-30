# Phase D5: display activity rejection reasons across roles

Shows full, wrapping rejection reasons on activity lists and dashboards across admin, cooperative admin, field officer, inspector, accountant and member views, including desktop/mobile ledger layouts. Supports the actual camelCase `rejectionReason` and the briefing’s snake_case alias. Only rejected activities render the reason; a localized fallback covers missing reasons. Existing status actions and API calls are unchanged.
# Phase D updates merged in this branch

## Phase D1: add filtered cooperative report summary

Adds a separate report summary with date, status, item and member filters. Empty filters preserve the no-query request. Other dashboard metrics are explicitly outside the filter scope. Requests have loading/error states and ignore stale responses.

Validation: production build passed. Live browser sent `GET /reports/summary?status=REJECTED` (200); Reset sent the no-query URL. English, French and Kinyarwanda labels were checked. Screenshots include desktop and 390px report layout.

**Blocked live acceptance:** the running backend returned 43 activities for REJECTED while the activity list contained 8 rejected rows. It currently ignores this filter. The frontend does not recalculate or fake filtered totals. Retest with the current backend deployed before marking ready.

Reproduce: sign in as COOP_ADMIN, open Dashboard, select a status and Apply; inspect the request and returned totals, then Reset. Also exercise date bounds and item/member selectors.

## Phase D6: add activity photo upload and document viewer

Adds an optional image file to activity creation and upload/retry controls on existing activities. Uploads use multipart field `file`; images are fetched through the authenticated document-file endpoint as blobs, displayed as expandable thumbnails and cleaned up on unmount. A failed photo upload does not resubmit the saved activity. File type/size validation, loading states and localized unavailable states are included.

Validation: production build passed. Created synthetic activity #102, then used the live status endpoint to reject it with a known reason (200). The browser displayed that exact reason. The baseline screenshot of the same record has no reason; the updated screenshot shows it. No API responses were mocked.

Reproduce: find a rejected activity with a reason and inspect it on Activities, member dashboard, inspector dashboard and accountant ledger. Confirm long text wraps and non-rejected activities remain unchanged.

All new UI text is in react-i18next English, Kinyarwanda and French locale keys. No backend or mobile source was changed. Each branch starts independently from `9d462f6d`; none requires another Phase D PR. The shared layout gets `min-w-0` so content can shrink on mobile; sidebar Sheet behavior is unchanged. The pre-existing header still extends about 26px past a 390px viewport and is outside these feature changes.

Verification used the supplied local test accounts and `http://localhost:8089`. Synthetic test records described above remain as verification fixtures. Existing bundle-size warnings remain; builds have zero errors.

### Live evidence

![after](after.png)

![before](before.png)

![mobile](mobile.png)

![expanded](expanded.png)
