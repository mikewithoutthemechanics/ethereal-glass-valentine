# Vercel deploy instructions

## One-command deploy (requires Vercel CLI)

1. Install Vercel CLI (once):
   ```bash
   npm install -g vercel
   ```

2. From inside `ethereal-glass-valentine/`, run:
   ```bash
   vercel --prod
   ```

   First run will prompt through setup (login, project name, scope). Accept defaults — it's a static site.

3. Vercel prints your live URL when done. Share it!

## Alternative: Git + Dashboard (recommended for updates)

1. Initialize git (if you haven't):
   ```bash
   cd ethereal-glass-valentine
   git init
   git add .
   git commit -m "Initial romantic webapp for Candice"
   ```

2. Create a new repo on GitHub/GitLab/Bitbucket (empty, no README)

3. Push:
   ```bash
   git remote add origin git@github.com:YOUR_USER/your-repo-name.git
   git push -u origin main
   ```

4. Go to https://vercel.com/new
   - Import your Git repo
   - Framework preset: **Other** (or "Static Site")
   - Build command: *leave blank* (no build step)
   - Output directory: *leave blank* (root)
   - Click **Deploy**

5. Future updates: just `git push` — Vercel auto-deploys

## Notes

- Pure static site (HTML/CSS/JS) — no build, no env vars needed
- Custom domain: Vercel dashboard → Your project → Settings → Domains → Add
- HTTPS is automatic
- Global CDN — fast everywhere

That's it. Share the `*.vercel.app` link with Candice 💖