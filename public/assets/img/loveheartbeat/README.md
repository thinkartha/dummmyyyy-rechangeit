# Brand source art

`logo.png` — the full lockup, 2000×2000: the heart mark above the
"LoveHeartBeat" wordmark.

The favicons in `../favicons/` are generated from the **mark only**. At 16px the
wordmark is a few pixels tall and renders as a grey smear, which is worse than no
favicon because it reads as a broken image.

To regenerate after the logo changes, crop the mark and resample:

```python
from PIL import Image
im = Image.open('logo.png').convert('RGB')
# Mark bounds in the current art: x 526..1476, y 492..1352 (wordmark starts at y 1457).
CX, CY, SIDE = 1001, 922, 1010
mark = im.crop((CX - SIDE//2, CY - SIDE//2, CX + SIDE//2, CY + SIDE//2))
for name, size in {
    'favicon-16x16.png': 16, 'favicon-32x32.png': 32,
    'apple-touch-icon.png': 180, 'android-chrome-192x192.png': 192,
    'android-chrome-512x512.png': 512, 'mstile-150x150.png': 150,
}.items():
    mark.resize((size, size), Image.LANCZOS).save(f'../favicons/{name}', optimize=True)
mark.resize((256, 256), Image.LANCZOS).save(
    '../favicons/favicon.ico', sizes=[(16,16), (32,32), (48,48), (64,64)])
```

Re-measure the crop box if the art changes — the numbers above are specific to this
file, not to the design.

Brand red `#FF3B4F`, sampled from the mark. It is the `theme_color` in
`../favicons/manifest.json` and the `theme-color` meta in both layouts
(`src/pug/layouts/Layout.pug` and `frontend/app/layout.tsx`).
