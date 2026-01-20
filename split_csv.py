#!/usr/bin/env python3
"""
Split a Marathi word CSV file into separate files based on the first grapheme cluster.

Usage:
    python split_csv.py <input_file.csv> [output_dir]

Examples:
    python split_csv.py mywords.csv           # outputs to data/ folder
    python split_csv.py mywords.csv data/     # outputs to data/ folder
    python split_csv.py mywords.csv ./        # outputs to current folder

This will create files like क.csv, का.csv, कि.csv, etc. in the output directory.
"""

import csv
import sys
import os
import re
import shutil

# Default output directory
DEFAULT_OUTPUT_DIR = 'data'

def split_into_graphemes(text):
    """
    Split text into grapheme clusters (visible characters).
    Handles Devanagari combining marks properly.

    Devanagari combining marks (matras, anusvara, etc.):
    - \u093E-\u094F: Vowel signs (matras)
    - \u0951-\u0957: Various signs
    - \u0962-\u0963: Vowel signs
    - \u093C: Nukta
    - \u094D: Virama (halant)
    """
    # Pattern: base character + any following combining marks
    # Base: consonants (\u0915-\u0939), vowels (\u0904-\u0914), or other (\u0950, etc.)
    # Combining: matras, nukta, virama, anusvara, visarga, etc.
    pattern = r'[\u0900-\u0963\u0970-\u097F][\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u094D]*'

    matches = re.findall(pattern, text)
    if matches:
        return matches
    return list(text)

def get_first_grapheme(word):
    """Get the first grapheme cluster of a word."""
    graphemes = split_into_graphemes(word)
    return graphemes[0] if graphemes else word[0] if word else ''

def split_csv_by_first_grapheme(input_file, output_dir=None):
    """
    Read a CSV file and split it into multiple files based on the first grapheme.

    Args:
        input_file: Path to the input CSV file
        output_dir: Directory to write output files (default: 'data')
    """
    # Use default output directory if not specified
    if output_dir is None:
        output_dir = DEFAULT_OUTPUT_DIR

    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    # Read the input file
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        rows = list(reader)

    if not rows:
        print(f"Error: {input_file} is empty")
        return

    # Get header
    header = rows[0]
    data_rows = rows[1:]

    # Group words by first grapheme
    groups = {}
    for row in data_rows:
        if not row or not row[0].strip():
            continue
        word = row[0].strip()
        first_grapheme = get_first_grapheme(word)

        if first_grapheme not in groups:
            groups[first_grapheme] = []
        groups[first_grapheme].append(row)

    # Backup original file
    input_basename = os.path.basename(input_file)
    input_name = os.path.splitext(input_basename)[0]
    backup_file = os.path.join(output_dir, f"{input_name}-original.csv")

    if not os.path.exists(backup_file):
        shutil.copy2(input_file, backup_file)
        print(f"Original file backed up to: {backup_file}")

    # Write each group to a separate file
    print(f"\nSplitting {input_file} -> {output_dir}/")
    print(f"Found {len(groups)} groups:\n")

    for grapheme, words in sorted(groups.items()):
        output_file = os.path.join(output_dir, f"{grapheme}.csv")

        # Check if file already exists
        if os.path.exists(output_file):
            print(f"  {grapheme}.csv - {len(words)} words (overwriting)")
        else:
            print(f"  {grapheme}.csv - {len(words)} words")

        with open(output_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(header)
            writer.writerows(words)

    print(f"\nDone! Created {len(groups)} CSV files in {output_dir}/")

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("\nError: Please provide an input CSV file")
        print(f"Usage: python split_csv.py <input_file.csv> [output_dir]")
        print(f"\nDefault output directory: {DEFAULT_OUTPUT_DIR}/")
        sys.exit(1)

    input_file = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_OUTPUT_DIR

    if not os.path.exists(input_file):
        print(f"Error: File not found: {input_file}")
        sys.exit(1)

    split_csv_by_first_grapheme(input_file, output_dir)

if __name__ == '__main__':
    main()
