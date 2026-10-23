# Saheli 7.2 — In-App Bug Reporting & Feedback Center Privacy Architecture

**Privacy-Preserving Error Collection, Health Record Scrubbing & Server-Side Security**

---

## 1. System Overview

Software errors, translation discrepancies, and cycle calculation anomalies must be reported and debugged without compromising user privacy. Saheli 7.2 introduces an **In-App Bug Reporting & Feedback Center** accessible via `Settings -> Help & Feedback` and `/feedback`.

Unlike conventional crash reporting SDKs (e.g. Sentry, Firebase Crashlytics) that indiscriminately dump memory heap states, IP addresses, and user identifiers, Saheli's reporting infrastructure is designed around **air-gapped privacy principles**:

```
+-------------------------------------------------------------------------------+
|                       Saheli Privacy-Preserving Reporter                      |
|                                                                               |
|  [ User Feedback Input ]  -->  [ Client-Side Health Scrubber ]                |
|                                       | (Strips PINs, Passphrases, Days)      |
|  [ Screenshot Upload ]    -->  [ In-App Canvas Redaction Modal ]              |
|                                       | (User obscures personal info)         |
|  [ Mandatory Consent ]    -->  [ Strict Consent Gate (consent === true) ]     |
|                                       |                                       |
|                                       v                                       |
|                           [ Server API: /api/feedback ]                       |
|                                 - IP Rate Limiting (5/10 min)                 |
|                                 - Server-Side Secret Scrubbing                |
|                                 - Real Acknowledgment (REP-...)               |
|                                       |                                       |
|                        +--------------+--------------+                        |
|                        |                             |                        |
|                        v                             v                        |
|              [ Real Server Status ]         [ Offline Text Fallback ]         |
+-------------------------------------------------------------------------------+
```

---

## 2. Multi-Layered Privacy Protections

### 1. Mandatory Explicit User Consent

The submit button remains disabled until the user explicitly checks the informed consent acknowledgment. Any API request arriving at `/api/feedback` with `consent: false` is immediately rejected with HTTP 400 (`feedback.errConsentRequired`).

### 2. Automatic Health Record & Secret Scrubbing

- **Client-Side**: The client payload serializer strictly white-lists fields: `category`, `severity`, `title`, `description`, `stepsToReproduce`, `expectedBehaviour`, `actualBehaviour`, `contact`, `appVersion`, and `browserInfo`. Personal period logs (`days`), notes, and encryption settings are completely excluded.
- **Server-Side Scrubbing**: Free-form text fields pass through regex scrubbers that redact accidental leakage of 4-digit PINs (`(?:pin|password|secret)\s*[:=]\s*\d{4,8}`), 10-digit telephone numbers, and Bearer authorization tokens.

### 3. Screenshot Privacy Redactor & Review Modal

When a user attaches a screenshot, Saheli presents a full-screen **Review & Redact Modal**:

- Renders the image on an HTML5 `<canvas>` element.
- Provides a drawing tool allowing the user to black out or blur sensitive calendar dates, diary notes, or personal contact names.
- Confirms redaction before committing the image payload.
- Server validates that the uploaded attachment is strictly a valid image mime type (`image/png`, `image/jpeg`, `image/webp`) and enforces a 2MB payload ceiling.

---

## 3. Server Security & Anti-Abuse Controls (`/api/feedback`)

1. **IP Rate Limiting**: The server enforces a sliding window rate limit of maximum 5 reports per 10-minute window per IP address. Exceeding requests receive HTTP 429.
2. **Deterministic Tracking Identifiers**: Successful transmissions generate a unique, non-guessable acknowledgment identifier (e.g. `REP-1792764871863-ZP6H8G`).
3. **Status Query Endpoint (`GET /api/feedback/status?id=...`)**: Users can verify whether their technical report was received and acknowledged by the engineering team without polling loops or third-party tracking cookies.
4. **Offline Export Fallback**: If the device is offline or the server is temporarily unreachable, the user is offered a 1-click **Export as Text** button (`exportReportAsText()`) to save the sanitized report locally or email it manually.
