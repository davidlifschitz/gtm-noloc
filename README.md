# NoLoc

Drop photos. Get copies without GPS and camera EXIF. Files never leave the browser.

Ask this answers: [users don't know their images carry location data](https://news.ycombinator.com/item?id=49198792)

- No account
- No upload
- Cap: 8 files, 8 MB each
- JPEG, PNG, WebP
- Canvas re-encode strips EXIF, including GPS
- Heuristic GPS peek on JPEG only

## Local

Open `index.html` in a browser, or:

```bash
python3 -m http.server 4173
```

This is not a forensic redaction service. Animated WebP becomes the first frame.

## GTM

Reply to people who already said they strip location from phone dumps by hand. Copy is in the page footer.
