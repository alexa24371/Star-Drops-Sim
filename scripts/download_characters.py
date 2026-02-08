#!/usr/bin/env python3

import os
import re
import time
import argparse
from io import BytesIO

import requests
from PIL import Image


# Characters to download
CHARACTERS = [
    "Shelly", "Nita", "Colt", "Brock", "Jacky", "Jessie",
    "Piper", "Pam", "Barley", "Crow", "Spike", "Leon",
    "Sandy", "Bea", "Amber",
]

API_URL = "https://brawlstars.fandom.com/api.php"

HEADERS = {
    "User-Agent": "BrawlStarsAssetFetcher/1.0 (educational use)"
}


def safe_basename(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"\s+", "_", s)
    s = re.sub(r"[^a-z0-9_\-]", "", s)
    return f"{s}.png"


def find_default_skin_image_url(character: str) -> str | None:
    """
    Uses MediaWiki API to:
    1. List images used on the character page
    2. Find the Default Skin file
    3. Resolve it to the final CDN image URL
    """

    # Step 1: list images on character page
    params = {
        "action": "query",
        "titles": character,
        "prop": "images",
        "imlimit": "max",
        "format": "json",
    }

    r = requests.get(API_URL, params=params, headers=HEADERS, timeout=20)
    r.raise_for_status()

    pages = r.json()["query"]["pages"]
    page = next(iter(pages.values()))

    images = page.get("images", [])
    if not images:
        return None

    # Step 2: find default skin filename
    for img in images:
        title = img["title"]  # e.g. File:Shelly_Skin-Default.png
        lname = title.lower()

        if "default" in lname and "skin" in lname:
            # Step 3: resolve to CDN URL
            info_params = {
                "action": "query",
                "titles": title,
                "prop": "imageinfo",
                "iiprop": "url",
                "format": "json",
            }

            ir = requests.get(API_URL, params=info_params, headers=HEADERS, timeout=20)
            ir.raise_for_status()

            ipages = ir.json()["query"]["pages"]
            ipage = next(iter(ipages.values()))

            return ipage["imageinfo"][0]["url"]

    return None


def download_image_as_png(image_url: str, dest_path: str) -> bool:
    try:
        r = requests.get(image_url, headers=HEADERS, timeout=20)
        r.raise_for_status()

        img = Image.open(BytesIO(r.content)).convert("RGBA")
        img.save(dest_path, format="PNG")

        return True
    except Exception as e:
        print(f"  image download failed: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Download Brawl Stars default skins as PNGs"
    )
    parser.add_argument(
        "--dest",
        default=os.path.join("assets", "characters"),
        help="destination directory",
    )
    parser.add_argument(
        "--no-backup",
        action="store_true",
        help="do not backup existing files",
    )

    args = parser.parse_args()
    os.makedirs(args.dest, exist_ok=True)

    total = len(CHARACTERS)
    success = 0

    for i, name in enumerate(CHARACTERS, start=1):
        print(f"({i}/{total}) {name}")

        try:
            image_url = find_default_skin_image_url(name)
        except Exception as e:
            print(f"  API error: {e}")
            continue

        if not image_url:
            print("  default skin not found")
            continue

        print(f"  CDN image: {image_url}")

        dest_path = os.path.join(args.dest, safe_basename(name))

        if not args.no_backup and os.path.exists(dest_path):
            os.replace(dest_path, dest_path + ".bak")

        if download_image_as_png(image_url, dest_path):
            print(f"  saved → {dest_path}")
            success += 1

        time.sleep(0.8)  # polite rate limit

    print(f"\nDone: {success}/{total} downloaded successfully.")


if __name__ == "__main__":
    main()
