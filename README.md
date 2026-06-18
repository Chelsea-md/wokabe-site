# GAME WIKI

Static bilingual GAME WIKI site by TeamWokabe.

## Local Preview

```bash
npm start
```

Open:

```text
http://localhost:4173/
```

## Publish At `wokabe.xyz`

Use the domain root for the site:

```text
https://wokabe.xyz/
```

### Vercel

1. Create a new Vercel project from this folder or Git repo.
2. Keep `vercel.json` at the project root.
3. Add `wokabe.xyz` in Vercel project settings under Domains.
4. Update your domain registrar DNS using the records Vercel provides.
5. Visit `https://wokabe.xyz/`.

### Cloudflare Pages or Netlify

1. Deploy this folder as a static site.
2. Keep `_redirects` at the project root.
3. Connect the custom domain `wokabe.xyz`.
4. Add the DNS records shown by the hosting provider.
5. Visit `https://wokabe.xyz/`.

### GitHub Pages

1. Push this folder to GitHub.
2. In the repository, go to `Settings > Pages`.
3. Choose the branch and folder to publish.
4. Set the custom domain to `wokabe.xyz`.
5. In Gabia DNS, add GitHub Pages records:

```text
A      @      185.199.108.153
A      @      185.199.109.153
A      @      185.199.110.153
A      @      185.199.111.153
CNAME  www    <GitHub username>.github.io
```

6. Wait for DNS and HTTPS provisioning, then enable `Enforce HTTPS`.

## Files

- `index.html`: main one-page GAME WIKI site
- `terms.html`: Terms of Use
- `privacy.html`: Privacy Policy
- `styles.css`: visual system
- `script.js`: language toggle and trend filter
- `server.js`: minimal local/static Node server for the root site
