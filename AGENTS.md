# Saheli Cycle Companion — Engineering Rules & Architecture

- **Local-first privacy**: Personal records live only in IndexedDB (optionally AES-GCM encrypted); no mandatory backend, analytics or remote tracking assets. Designed for privacy on shared family phones.
- **Project Structure**: Pages and logic are plain JS/TS under `src/pages`, `src/lib`, `src/data`, `src/content`; route files in `src/routes` are thin `.jsx` wrappers. Clinical thresholds and configuration live in `src/config.js`.
- **State & Storage Synchronization**: Serialize record mutations against the last successfully persisted record; commit UI state only after IndexedDB operations complete, so rapid controls cannot overwrite newer changes.
- **Import Validation**: Validate imported record containers, settings, reminders and day relationships before applying either merge or replacement, ensuring invalid backups cannot corrupt the diary.
- **Medical Safeguards**: Never display ovulation or fertile window estimates for minors (under 18) or highly irregular cycles (>7 days variation). Keep deterministic red-flag triage operational at all times.
- **Git History Integrity**: Never force-push or rewrite pushed git history. Maintain working branch states with clean, verifiable CI checks.
