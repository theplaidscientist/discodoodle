# Disco Doodle — Domain Setup Package

This package finishes wiring `discodoodle.com` to your GitHub Pages site. It's cumulative — it includes everything from the earlier rebrand package (Disco Doodle branding, disco ball intro) PLUS the domain-specific changes below. You can apply this package on its own; you don't need to apply the earlier one first.

## What changed in this package

1. **New `CNAME` file** at the repo root containing `discodoodle.com` — this is what tells GitHub Pages to serve your site on the custom domain instead of (or in addition to) the `github.io` URL.
2. **Every hardcoded URL** across the site (canonical links, Open Graph/Twitter image URLs, `sitemap.xml`, `robots.txt`, and the footer's share links) now points to `https://discodoodle.com/...` instead of the old placeholder `theplaidscientist.github.io/sketchlabcentral` path.
3. Cleaned up a handful of leftover "update this once the domain is live" comments that are now stale since the URLs are already updated.

## How to apply it

Copy everything from this package into your local clone of the `sketchlabcentral` repo, overwriting existing files, then commit and push. (See the bottom of this file for an easier, no-copy-paste way to do this going forward.)

## Steps to actually go live on discodoodle.com

**1. Add DNS records at Porkbun.**
In Porkbun's DNS management for `discodoodle.com`, add:

- Four **A records** on the root/apex (`@`), pointing to GitHub Pages' current IPs:
  - `185.199.108.153`
  - `185.199.109.153`
  - `185.199.110.153`
  - `185.199.111.153`
- (Optional but recommended) A **CNAME record** for `www` pointing to `theplaidscientist.github.io`, so `www.discodoodle.com` also works and redirects properly.

Remove any placeholder/parking DNS records Porkbun may have added by default.

**2. Push this package (with the new `CNAME` file) to GitHub.**
Once GitHub sees the `CNAME` file in the repo, it'll pick it up automatically.

**3. Set the custom domain in repo settings.**
Go to your repo → **Settings → Pages**. Under "Custom domain," enter `discodoodle.com` and save. (If the `CNAME` file is already in the repo, GitHub may auto-detect it, but it's worth confirming here.) GitHub will check your DNS — this can take anywhere from a few minutes to ~24 hours to fully propagate and go green.

**4. Enable HTTPS.**
Once GitHub finishes provisioning a TLS certificate for the domain (same Settings → Pages screen), an "Enforce HTTPS" checkbox will become available. Turn it on. Until the cert is ready, the checkbox will be grayed out — that's expected, just check back later.

**5. Add the domain to Firebase's authorized domains — important, don't skip this one.**
Your admin moderation page (`wall/admin.html`) uses Firebase Google Sign-In, and Firebase only allows sign-in from domains it explicitly trusts. Right now it trusts the old `github.io` URL (and Firebase's own defaults), but not `discodoodle.com`. Until you add it, trying to sign into `/wall/admin.html` from the new domain will fail with the "domain isn't authorized for sign-in" error that's already built into that page.

Fix: Firebase console → **Authentication → Settings → Authorized domains** → **Add domain** → enter `discodoodle.com` (and `www.discodoodle.com` if you set up the `www` CNAME). Takes effect immediately, no waiting.

**6. Set up Google Search Console for the new domain.**
Search Console tracking is per-domain, so the old `github.io` URL (which likely was never meaningfully indexed anyway) doesn't carry over. Add `discodoodle.com` as a new property, verify ownership (Search Console will give you a DNS TXT record or HTML file option — DNS TXT via Porkbun is easiest since you're already in there), then submit `https://discodoodle.com/sitemap.xml` under Sitemaps.

**7. Repo rename — do this last, after the domain is confirmed working.**
Once you've confirmed `discodoodle.com` loads the site correctly over HTTPS, it's safe to rename the GitHub repo from `sketchlabcentral` to something like `discodoodle`. A couple of things worth knowing first:
- GitHub auto-redirects normal repo URLs and `git clone`/`git pull`/`git push` operations after a rename, so nothing breaks for you as the owner.
- GitHub does **not** auto-redirect the old GitHub Pages project-site URL (`theplaidscientist.github.io/sketchlabcentral/`) after a rename — but this is a non-issue for you, because your custom domain is tied to the repo object itself (it survives the rename), and all real visitor traffic will be going through `discodoodle.com`, not the `github.io` URL.
- This is also the natural moment to prune anything in the repo that isn't Disco Doodle — you mentioned wanting only Disco Doodle–related material on this site going forward, so a rename is a good checkpoint to do that cleanup at the same time.

## What's intentionally NOT in this package

The site restructure you described (left-sidebar pack menu with mobile hamburger collapse, redesigned Gallery/Submit pages, removing the gallery auto-scroll, larger gallery image cards) is a separate, bigger piece of work — per your own call, that's happening as its own follow-up once the domain is live and confirmed working. Just say the word when you're ready for it.
