# malcolmkennedy.com

Static site served by GitHub Pages from the root of `main`.

## Adding a map

1. Create a folder named after the URL slug, containing `index.html` (the full self-contained map) and `thumb.png` (a ~800×600 preview).

   ```
   heritage-trees/
     index.html   → malcolmkennedy.com/heritage-trees/
     thumb.png
   ```

2. Copy a `<a class="tile">…</a>` block in `index.html` and update the `href`, `img src`, title, and blurb.
3. Commit and push. Live in ~1 minute.

## Notes

- The repo is public. Anything committed is world-readable — keep API keys out of it, and scope any client-side tokens (Mapbox etc.) to `malcolmkennedy.com` in the provider's dashboard.
- `CNAME` holds the custom domain; don't delete it or Pages reverts to `zuzubak.github.io`.
- `.nojekyll` disables Jekyll processing so files/folders starting with `_` are served as-is.

## DNS (at Squarespace)

Apex `@` → four A records:

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

`www` → CNAME `zuzubak.github.io`
