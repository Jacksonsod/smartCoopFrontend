# Phase D4: add cooperative sync conflict resolution

Adds `/sync-conflicts` for COOP_ADMIN with parsed client JSON, explicit server-reference information, KEEP_SERVER/KEEP_CLIENT/MERGE choices and confirmation. MERGE requires a JSON object and sends mergedPayload only for that mode. Successful resolutions remove the entry; failed operations keep it available for retry.

Validation: production build passed. Two genuine synthetic MEMBER entries were posted to the local sync queue, producing conflict #10 referencing #9. The browser displayed the conflict, submitted KEEP_SERVER (200), and showed the empty list afterward. No API responses were mocked.

**Incomplete requirement:** `GET /sync/conflicts` supplies `entityPayload` and `conflictWithEntityId`, but no server payload or readable referenced sync-record endpoint. The server column explicitly says unavailable; it does not mislabel the client JSON as both versions. Full side-by-side comparison requires a separately authorized backend response addition. Keep this PR draft until that decision is made.

Reproduce: submit two synthetic MEMBER sync entries with the same nationalId, open Sync conflicts, inspect the client payload and reference, choose a resolution, confirm and verify disappearance. For MERGE, first enter invalid JSON to verify validation, then an object. Resolution semantics remain entirely server-owned.

All new UI text is in react-i18next English, Kinyarwanda and French locale keys. No backend or mobile source was changed. Each branch starts independently from `9d462f6d`; none requires another Phase D PR. The shared layout gets `min-w-0` so content can shrink on mobile; sidebar Sheet behavior is unchanged. The pre-existing header still extends about 26px past a 390px viewport and is outside these feature changes.

Verification used the supplied local test accounts and `http://localhost:8089`. Synthetic test records described above remain as verification fixtures. Existing bundle-size warnings remain; builds have zero errors.


### Live evidence

![after](after.png)

![before](before.png)
