<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Saheli is local-first: personal records live only in IndexedDB (optionally AES-GCM encrypted); no backend, analytics or remote assets. Why: privacy for shared phones.
- Pages/logic are plain JS (.jsx/.js) under src/pages, src/lib, src/data, src/content; route files in src/routes are thin .jsx wrappers. Thresholds live in src/config.js. Why: hackathon spec.
- Serialize record mutations against the last successfully persisted record; commit UI state only after IndexedDB completes, so rapid controls cannot overwrite newer changes.
- Validate imported record containers, settings, reminders and day relationships before applying either merge or replacement, so invalid backups cannot break the diary.
