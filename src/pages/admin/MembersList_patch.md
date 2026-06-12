# MembersList.jsx — Patch Instructions for Security Tab

Apply **3 changes** to `frontend/src/pages/admin/MembersList.jsx`:

---

## Change 1 — Add import at the top

After the existing import block (before `const P = {`), add:

```jsx
import SecuritySection from './SecuritySection'
```

---

## Change 2 — Add 'security' to the view-mode tabs

Find this block in the `AdminMembersList` component's render:

```jsx
{[
  { key: 'committee',   label: 'Committee',          icon: Users   },
  { key: 'assignments', label: 'Active Assignments',  icon: History },
].map(t => (
```

Replace it with:

```jsx
{[
  { key: 'committee',   label: 'Committee',          icon: Users   },
  { key: 'assignments', label: 'Active Assignments',  icon: History },
  { key: 'security',    label: 'Security',            icon: Shield  },
].map(t => (
```

> `Shield` is already imported in the file.
> If not present, add it to the lucide-react import line.

---

## Change 3 — Render the SecuritySection

Find the closing `{/* ── Modals ── */}` comment block.
Just BEFORE it, add:

```jsx
{/* ── Security section ──────────────────────────────────────── */}
{viewMode === 'security' && (
  <SecuritySection />
)}
```

---

That's it — no other changes to MembersList.jsx are needed.