#!/usr/bin/env python3
"""
Rescale all character PNG images to 376px width with proportional height.
Usage:
  python rescale_characters.py           # rescales all PNGs in ../client/assets/characters
  python rescale_characters.py --source /path/to/chars --width 512

Requires: Pillow
pip install Pillow
"""

import os
import argparse
from pathlib import Path
from PIL import Image


def rescale_image(input_path: str, output_path: str, target_width: int) -> bool:
    """Rescale image to target_width while maintaining aspect ratio."""
    try:
        with Image.open(input_path) as img:
            # Convert RGBA if needed for PNG
            if img.mode == 'RGBA':
                pass  # Keep RGBA
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            original_width, original_height = img.size
            aspect_ratio = original_height / original_width
            new_height = int(target_width * aspect_ratio)
            
            # Resample with high-quality filter
            resized = img.resize((target_width, new_height), Image.Resampling.LANCZOS)
            
            # Save back to same format (PNG)
            resized.save(output_path, 'PNG', quality=95)
            print(f"  {Path(input_path).name}: {original_width}x{original_height} → {target_width}x{new_height}")
            return True
    except Exception as e:
        print(f"  ERROR rescaling {input_path}: {e}")
        return False


def main():
    p = argparse.ArgumentParser(description="Rescale character PNG images to 376px width")
    p.add_argument("--source", default=os.path.join("..", "client", "assets", "characters"),
                   help="source directory with PNG files (default: ../client/assets/characters)")
    p.add_argument("--width", type=int, default=376,
                   help="target width in pixels (default: 376)")
    args = p.parse_args()

    source_dir = os.path.normpath(args.source)
    target_width = args.width

    if not os.path.isdir(source_dir):
        print(f"ERROR: source directory not found: {source_dir}")
        return

    png_files = sorted([f for f in os.listdir(source_dir) if f.lower().endswith('.png')])
    
    if not png_files:
        print(f"No PNG files found in {source_dir}")
        return

    print(f"Rescaling {len(png_files)} images to {target_width}px width...\n")
    
    success = 0
    for filename in png_files:
        input_path = os.path.join(source_dir, filename)
        output_path = input_path  # overwrite
        if rescale_image(input_path, output_path, target_width):
            success += 1

    print(f"\nDone: {success}/{len(png_files)} rescaled successfully.")


if __name__ == "__main__":
    main()
