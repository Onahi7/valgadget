# Phone Images Seed

Seed-ready seed list for Nigeria-market product catalog image assets.

- The manifest at assets/phones/manifest.json contains the list of models with brands, slugs, and image_url placeholders.
- Image assets can be downloaded via the script at scripts/download_images.py once image URLs are filled.
- By default, image_url values are empty. We will populate them with official image URLs from brand sites.

Usage:
- Add real image URLs in manifest.json under image_url for each model.
- Run the downloader: python3 scripts/download_images.py (from the repo root).
