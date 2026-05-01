#!/usr/bin/env python3
import json, os, urllib.request
from urllib.parse import urlparse

MANIFEST = os.path.join(os.path.dirname(__file__), '..', 'assets', 'phones', 'manifest.json')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets', 'phones')

def slug_ext(url):
    if not url:
        return '', ''
    path = urlparse(url).path
    base = os.path.basename(path)
    if '.' in base:
        name, ext = base.rsplit('.', 1)
        return name, f'.{ext}'
    return base, '.jpg'

def main():
    if not os.path.exists(MANIFEST):
        print(f"Manifest not found: {MANIFEST}")
        return
    with open(MANIFEST, 'r', encoding='utf-8') as f:
        data = json.load(f)
    models = data.get('models', [])
    for m in models:
        image_url = m.get('image_url', '').strip()
        if not image_url:
            continue
        brand = m.get('brand', 'unknown').lower()
        slug = m.get('slug')
        if not slug:
            continue
        brand_dir = os.path.join(OUTPUT_DIR, brand)
        os.makedirs(brand_dir, exist_ok=True)
        name, ext = slug_ext(image_url)
        out_path = os.path.join(brand_dir, f"{slug}{ext}")
        print(f"Downloading {image_url} -> {out_path}")
        try:
            urllib.request.urlretrieve(image_url, out_path)
        except Exception as e:
            print(f"Failed to download {image_url}: {e}")

if __name__ == '__main__':
    main()
