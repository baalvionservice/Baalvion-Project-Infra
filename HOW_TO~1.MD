# How to Cut a Proper GitHub Release — Baalvion-Project-Infra

This document walks you through publishing a clean, professional, enterprise-grade
release on GitHub. Follow it step-by-step for `v1.0.0` and reuse it for every
subsequent release.

---

## 0. Decide the Version Number

Use **Semantic Versioning** — `vMAJOR.MINOR.PATCH`.

| Situation                                                  | Bump      | Example         |
|------------------------------------------------------------|-----------|-----------------|
| First production release                                   | n/a       | `v1.0.0`        |
| Backward-compatible new feature                            | MINOR     | `v1.1.0`        |
| Backward-compatible bug fix                                | PATCH     | `v1.0.1`        |
| Breaking change                                            | MAJOR     | `v2.0.0`        |
| Not yet production-stable                                  | pre-1.0   | `v0.1.0`        |
| Pre-release of an upcoming version                         | suffix    | `v1.1.0-rc.1`   |

Since your repo is described as an "Initial production infrastructure monorepo
baseline", `v1.0.0` is the right tag — it signals GA, not experimental.

If you want to signal "still stabilizing," use `v0.1.0` instead.

---

## 1. Add the CHANGELOG and Release Notes to the Repo

Both files have been generated for you. Drop them into the repo root:

```
Baalvion-Project-Infra/
├── CHANGELOG.md                ← from outputs/CHANGELOG.md
└── RELEASE_NOTES_v1.0.0.md     ← from outputs/RELEASE_NOTES_v1.0.0.md  (optional in repo)
```

Commit them:

```bash
git add CHANGELOG.md RELEASE_NOTES_v1.0.0.md
git commit -m "docs: add CHANGELOG and v1.0.0 release notes"
git push origin main
```

---

## 2. Tag the Release Commit

A **release** on GitHub is anchored to a **git tag**. Create an annotated,
optionally signed tag on the commit you want to ship.

### Option A — Command Line (recommended)

```bash
# Make sure you're on main and up to date
git checkout main
git pull --ff-only

# Create an annotated tag
git tag -a v1.0.0 -m "Baalvion-Project-Infra v1.0.0 — Foundation"

# (Optional but encouraged) sign the tag with your GPG key
git tag -s v1.0.0 -m "Baalvion-Project-Infra v1.0.0 — Foundation"

# Push the tag to GitHub
git push origin v1.0.0
```

### Option B — GitHub Web UI

The Releases page can create the tag for you when you publish the release.
This is fine for one-off releases but the CLI route is more auditable.

---

## 3. Create the Release on GitHub

### Option A — GitHub Web UI (easiest for the first time)

1. Go to your repo: `https://github.com/baalvionservice/Baalvion-Project-Infra`
2. Click **Releases** (right sidebar, under "About").
3. Click **Create a new release** (or **Draft a new release**).
4. **Choose a tag:** select `v1.0.0` (or type it and choose "Create new tag on publish").
5. **Target:** `main`.
6. **Release title:** `v1.0.0 — Foundation`
7. **Release notes:** paste the contents of `RELEASE_NOTES_v1.0.0.md`.
   - Or click **Generate release notes** to auto-populate from PRs and edit on top.
8. **Set as the latest release:** ✅ checked.
9. **Set as a pre-release:** ❌ unchecked (this is GA).
10. **Release date:** GitHub stamps it automatically when you click Publish.
    You cannot backdate via the UI — see Section 6 if you need a custom date.
11. Click **Publish release**.

### Option B — GitHub CLI (`gh`)

If you have the `gh` CLI installed and authenticated:

```bash
gh release create v1.0.0 \
  --title "v1.0.0 — Foundation" \
  --notes-file RELEASE_NOTES_v1.0.0.md \
  --latest \
  --target main
```

To attach build artifacts (tarballs, SBOMs, signed binaries):

```bash
gh release create v1.0.0 \
  --title "v1.0.0 — Foundation" \
  --notes-file RELEASE_NOTES_v1.0.0.md \
  --latest \
  --target main \
  ./dist/baalvion-cli-v1.0.0-linux-x64.tar.gz \
  ./dist/baalvion-cli-v1.0.0-darwin-arm64.tar.gz \
  ./dist/SBOM.spdx.json
```

To mark a release as pre-release (for `-rc`, `-beta`, `-alpha`):

```bash
gh release create v1.1.0-rc.1 \
  --title "v1.1.0-rc.1" \
  --notes-file RELEASE_NOTES_v1.1.0-rc.1.md \
  --prerelease \
  --target main
```

---

## 4. About the Release Date

GitHub records two timestamps on every release:

| Field          | What it means                                          | Editable?           |
|----------------|--------------------------------------------------------|---------------------|
| **Created**    | When the release draft was created                     | No                  |
| **Published** | When you clicked "Publish release"                     | No (UI)             |
| **Tag date**   | When the underlying git tag was created                | Yes — see Section 6 |

The date shown publicly on the Releases page is the **published** timestamp.
You **cannot** change it from the GitHub UI. If a specific date matters, you
must either:

1. Publish on that exact day, **or**
2. Backdate the underlying git tag (see Section 6).

For `v1.0.0`, the natural choice is to publish it on **2026-05-27**, matching
the repo's first push.

---

## 5. Automate Releases Going Forward (Recommended)

Add this workflow to `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*.*.*'

permissions:
  contents: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup PNPM
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm turbo run build

      - name: Generate release notes
        id: notes
        run: |
          echo "RELEASE_TAG=${GITHUB_REF#refs/tags/}" >> $GITHUB_ENV

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: ${{ env.RELEASE_TAG }}
          name: ${{ env.RELEASE_TAG }}
          generate_release_notes: true
          prerelease: ${{ contains(env.RELEASE_TAG, '-') }}
          files: |
            dist/**
```

Now every `git push origin vX.Y.Z` automatically publishes a release.

---

## 6. (Advanced) Backdating a Tag

If you really need the release to show a specific historical date, you must
backdate the **tag** itself. This rewrites the tag metadata.

```bash
# Delete any existing tag locally and remotely
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0

# Recreate the tag with a custom date
GIT_COMMITTER_DATE="2026-05-27T10:00:00" \
  git tag -a v1.0.0 -m "Baalvion-Project-Infra v1.0.0 — Foundation" 61cec8f

# Push it
git push origin v1.0.0
```

⚠️  This affects the **tag date** but not the GitHub release "published"
timestamp — that is still set when you click Publish. For most enterprise
scenarios, just publish the release on the date you want.

---

## 7. Post-Release Checklist

After publishing:

- [ ] Verify the release page renders correctly.
- [ ] Confirm the tag points to the intended commit (`git show v1.0.0`).
- [ ] Confirm `CHANGELOG.md` reflects the release.
- [ ] Announce in the engineering channel.
- [ ] Update internal documentation referencing the new version.
- [ ] Open a tracking issue for the next milestone (`v1.1.0`).

---

## 8. Quick Reference — Common Commands

```bash
# List all tags
git tag -l

# Show a tag
git show v1.0.0

# Delete a local tag
git tag -d v1.0.0

# Delete a remote tag
git push origin :refs/tags/v1.0.0

# List releases
gh release list

# View a release
gh release view v1.0.0

# Edit a release's notes
gh release edit v1.0.0 --notes-file RELEASE_NOTES_v1.0.0.md

# Delete a release (keeps the tag)
gh release delete v1.0.0

# Delete a release AND the tag
gh release delete v1.0.0 --cleanup-tag
```

---

## TL;DR — Do This Right Now

```bash
# 1. Copy CHANGELOG.md and RELEASE_NOTES_v1.0.0.md into the repo root
# 2. Commit them
git add CHANGELOG.md RELEASE_NOTES_v1.0.0.md
git commit -m "docs: add CHANGELOG and v1.0.0 release notes"
git push origin main

# 3. Tag the release
git tag -a v1.0.0 -m "Baalvion-Project-Infra v1.0.0 — Foundation"
git push origin v1.0.0

# 4. Publish the release
gh release create v1.0.0 \
  --title "v1.0.0 — Foundation" \
  --notes-file RELEASE_NOTES_v1.0.0.md \
  --latest \
  --target main
```

Then check `https://github.com/baalvionservice/Baalvion-Project-Infra/releases`
— your release will appear with a publication date of today.
