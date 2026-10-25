# Saheli 11.0 — Privacy, Consent & Field-Level Sharing Matrix

## 1. Absolute Privacy Boundaries

To safeguard personal autonomy, certain categories of data are **cryptographically excluded** from partner snapshots and cannot be shared regardless of toggle state:

1. **Private Diary Notes**: Strictly excluded. Even if calendar dates are shared, `dayData.notes` and `dayData.note` are deleted from memory before envelope encryption.
2. **AI Health Chat Logs**: Excluded. Conversations with AI agents (Eeve, FLASH, Instinct, Diva) remain on the owner's device only.
3. **Fertile Window / Ovulation Estimates for Minors**: Safeguarded. Minors under 18 never have fertile windows computed, displayed, or shared.
4. **Master Encryption Keys & Recovery Keys**: Never transmitted across any network channel.

---

## 2. Granular Field-Level Permissions Matrix

| Permission Key       | Default | Description                         | Impact when Disabled                     |
| :------------------- | :------ | :---------------------------------- | :--------------------------------------- |
| `calendar`           | `true`  | Logged calendar dates               | Entire calendar is hidden from partner   |
| `periodDates`        | `true`  | Period start/end dates and flow     | Flow intensity and period markers hidden |
| `cycleHistory`       | `true`  | Average cycle and period length     | Cycle statistics hidden                  |
| `periodEstimates`    | `true`  | Next predicted period start & phase | Cycle phase and predictions hidden       |
| `cycleEducation`     | `true`  | Supportive tips for cycle empathy   | Educational cards hidden                 |
| `wellnessUpdates`    | `true`  | Sleep and hydration check-ins       | Sleep and water intake hidden            |
| `symptoms`           | `false` | General symptoms (cramps, mood)     | Specific physical/emotional signs hidden |
| `fertilityOvulation` | `false` | Ovulation estimates (Adults only)   | Fertile window strictly hidden           |
| `diaryNotes`         | `false` | Free-text personal diary entries    | **Permanently excluded by protocol**     |

---

## 3. Voluntary & Dynamic Consent

- **Strictly Opt-In**: Partner Connect is disabled by default.
- **Live Preview Drawer**: The owner can click "What your partner sees" at any time to inspect the exact filtered presentation before sending an update.
- **Unilateral Revocation**: Revocation requires zero confirmation from the partner. Clicking "Disconnect" instantly wipes the relay and cuts off all updates.
