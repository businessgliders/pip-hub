# Master Kanban Sync Guide

This document is for **spoke agents** (in pip-events, pip-partner, pip-support) syncing the Master Kanban components from pip-hub.

**TL;DR:** Fetch 8 files from `raw.githubusercontent.com/businessgliders/pip-hub/main/src/`, overwrite your locals, check the changelog for breaking changes, patch callsites if needed, update your README.

---

## Files to sync

All files are fetched from `https://raw.githubusercontent.com/businessgliders/pip-hub/main/src/` and placed at the same relative path in your spoke.

| File | Source URL |
|---|---|
| `components/master-kanban/index.js` | `raw.githubusercontent.com/businessgliders/pip-hub/main/src/components/master-kanban/index.js` |
| `components/master-kanban/MasterKanbanBoard.jsx` | `raw.githubusercontent.com/businessgliders/pip-hub/main/src/components/master-kanban/MasterKanbanBoard.jsx` |
| `components/master-kanban/MasterKanbanColumn.jsx` | `raw.githubusercontent.com/businessgliders/pip-hub/main/src/components/master-kanban/MasterKanbanColumn.jsx` |
| `components/master-kanban/MasterKanbanCard.jsx` | `raw.githubusercontent.com/businessgliders/pip-hub/main/src/components/master-kanban/MasterKanbanCard.jsx` |
| `components/master-kanban/MasterBoardTabs.jsx` | `raw.githubusercontent.com/businessgliders/pip-hub/main/src/components/master-kanban/MasterBoardTabs.jsx` |
| `components/master-kanban/MasterSwimlaneScroller.jsx` | `raw.githubusercontent.com/businessgliders/pip-hub/main/src/components/master-kanban/MasterSwimlaneScroller.jsx` |
| `hooks/useHorizontalScroll.js` | `raw.githubusercontent.com/businessgliders/pip-hub/main/src/hooks/useHorizontalScroll.js` |
| `hooks/useIsTouchViewport.js` | `raw.githubusercontent.com/businessgliders/pip-hub/main/src/hooks/useIsTouchViewport.js` |

---

## Sync procedure

1. **Fetch all 8 files** from the URLs above and overwrite your local copies.

2. **Read the changelog** in `components/master-kanban/index.js` (top of the file, after the version export). Note the current version you have and the new version you're syncing to.

3. **Check for BREAKING changes** in the changelog between your current version and the new one:
   - If any entry says `[BREAKING]` or `[⚠️ BREAKING]`, a callsite change is required.
   - If only patch/minor updates, no changes needed — you can skip to step 5.

4. **If breaking changes:** Find every callsite in your spoke that uses the affected components:
   - `MasterKanbanBoard` → search `components/` and `pages/` for imports
   - `MasterBoardTabs` → same search
   - Other components → same search
   - Look for the prop or behavior that changed (changelog will say what changed).
   - Rewrite the callsite per the changelog instructions.
   - Test the board in your spoke.

5. **Update your README** — add a line in the "Dependencies" or "Version History" section:
   ```
   Master Kanban synced to vX.Y.Z on YYYY-MM-DD from pip-hub@<commit-hash>
   ```

6. **Commit and push** the updated files + README.

---

## Governance

- **Master Kanban files are READ-ONLY in spokes.** Do not edit them locally. If you need a behavior change, file an issue against pip-hub or ask the main agent to make the change in Hub, bump the version, and you re-sync.
- **Spoke-specific customizations go outside the master files** — in your own components that import and use `MasterKanbanBoard`, in your column configs, in your `renderCardContent` prop, etc.
- **Version stamp is your source of truth.** `MASTER_KANBAN_VERSION` in `components/master-kanban/index.js` tells you exactly what you have.

---

## When to sync

Sync when:
- A bug fix in Master Kanban is relevant to your spoke.
- A new feature in Master Kanban improves your user experience.
- Hub publishes a major version and you want to stay current.

No obligation to sync immediately — you own the timing. Drift is OK if intentional.

---

## FAQ

**Q: What if my spoke has a local edit to `MasterKanbanColumn.jsx`?**  
A: You've violated the read-only rule. The next sync will overwrite your change. Solution: move the customization out of the master file (into a wrapper component or a new spoke-specific component). Then sync, and import your wrapper instead.

**Q: The changelog says BREAKING but I don't see my component affected.**  
A: Read the changelog description carefully. Breaking changes may only affect specific props or callbacks. If your callsite doesn't use the affected prop, no change needed.

**Q: Can I ask the Hub agent to add a feature just for my spoke?**  
A: It goes in Master only if it benefits all 3 spokes. If it's spoke-specific, build it in your spoke as a wrapper or extension, not in the master files.

---

## Support

- **Questions about what changed?** Read the full changelog in `components/master-kanban/index.js`.
- **Need a Hub-level change?** Ask the Hub agent in the pip-hub chat to bump Master Kanban and explain the feature.
- **Sync broke your board?** Roll back the files, identify the breaking change in the changelog, fix the callsite, try again. Still broken? Compare the old vs. new component API in the Hub repo on GitHub.