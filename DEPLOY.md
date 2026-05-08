# Netlify deploy instructions

## One-command deploy (requires Netlify CLI)

1. Install Netlify CLI (once):
   ```bash
   npm install -g netlify-cli
   ```

2. Authenticate (once):
   ```bash
   netlify login
   ```

3. From inside `ethereal-glass-valentine/`, deploy:
   ```bash
   netlify deploy --prod
   ```

   First run will ask to create a new site — just follow prompts.

4. Share the live URL that prints at the end!

## Alternative: Drag & drop (no terminal)

Go to https://app.netlify.com/drop and drag the entire `ethereal-glass-valentine` folder. Netlify gives you a live link instantly.

## Environment

This is a static site — no env vars, no build step. Just HTML/CSS/JS.

## Custom domain

In Netlify dashboard → Site settings → Domain management → Add custom domain. Point your domain's DNS to Netlify's nameservers or use A/AAAA records as instructed.