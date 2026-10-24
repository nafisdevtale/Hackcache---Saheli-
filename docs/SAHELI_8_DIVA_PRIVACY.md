# SAHELI 8.0 — DIVA PRIVACY FIREWALL & DATA BOUNDARY SPECIFICATION

**Document:** Privacy Firewall & Data Isolation Guarantees  
**Implementation:** `src/lib/divaRouter.js` (`sanitizeDivaContext`) & `src/lib/divaOrchestrator.js`  
**Conformance:** Local-first zero-surveillance design

---

## 1. Core Principles

Saheli was engineered from inception for women and girls in regions where phones are frequently shared among family members. Saheli 8.0 strictly upholds:

1. **No Unified Surveillance Profile:** Diva acts solely as a transient, in-memory coordinator during active conversational turns. Diva **never** combines menstrual records, shopping preferences, and media tastes into a persistent composite user profile.
2. **Strict Specialist Data Isolation:** Eeve, FLASH, and INSTINCT maintain completely decoupled storage domains:
   - Cycle & Symptoms Diary: `IndexedDB` (optionally AES-GCM encrypted).
   - FLASH Preferences & Re-orders: `localStorage` (`saheli_flash_*`).
   - INSTINCT Library & Watch Progress: `localStorage` (`saheli_instinct_*`).
   - Cross-domain reading is programmatically prohibited.
3. **Zero Health Leakage to Commercial Agents:** Menstrual phase data, flow intensity, pain scores, symptom logs, or medical conditions are **never** forwarded to FLASH or INSTINCT.

---

## 2. Privacy Firewall Implementation

When a user query is dispatched to one or more specialists, the payload passes through `sanitizeDivaContext(agentId, context)`:

```
[ Incoming User Context ]
(cycleDay, symptoms, painLevel, flow, notes, budget, streamingServices)
                          |
                          v
               [ Diva Privacy Firewall ]
             /            |            \
            /             |             \
           v              v              v
     [ For EEVE ]    [ For FLASH ]  [ For INSTINCT ]
  Opt-in cycle info   Health data    Health data
  permitted for       COMPLETELY     COMPLETELY
  clinical education  STRIPPED       STRIPPED
                      Only budget &  Only genres &
                      materials      services
                      permitted      permitted
```

### Restricted Key Blacklist (Enforced at Runtime)

- `cycleDay`, `cycle_diary`, `lastPeriodDate`, `isPeriodToday`
- `flow`, `painLevel`, `symptoms`, `symptoms_history`
- `fertility_status`, `ovulation_observations`, `notes`, `private_notes`
- `diagnosed_medical_conditions`, `menstrual_history`, `medical_conditions`
- `pregnancy_tracker`, `health_chat_history`, `health_chat_logs`

---

## 3. Ephemeral In-Memory Chat Session

- Chat messages in the Diva view exist only in transient React component state (`useState`) during the active session.
- Clicking the **Clear Conversation** button purges the message thread immediately from memory.
- Closing or refreshing the tab resets the coordinator state.
- No remote telemetry, analytics, or behavioral cookies are emitted.

---

## 4. Red-Flag Clinical Boundary

- When a query contains critical clinical red flags (e.g. severe hemorrhaging, acute fainting, suspected ectopic pregnancy):
  - Diva prioritizes Eeve exclusively.
  - Emergency clinical triage banners with verified national helpline numbers (112, 108, 1091) are pinned to the top of the interface.
  - Commercial product links and media suggestions are immediately suppressed.
