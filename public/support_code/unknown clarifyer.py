import json
import re

# List of module code prefixes mapped to "Unknown"
unknown_prefixes = [
    "BPS", "BRP", "BS", "CFG", "CSX", "DL", "DMA", "DMC", "DMD", "DMS", "DMX", "DMY",
    "DTK", "EM", "ETP", "FSC", "GEI", "GPM", "GSS", "IDX", "IY", "IND", "INT", "LAK",
    "LAL", "LAR", "LAS", "LAT", "LAV", "LAX", "LI", "LSX", "MB", "MEM", "MIH", "ML",
    "MLE", "MST", "MT", "MTM", "MW", "NE", "NEP", "NEX", "NFB", "NFC", "NFS", "NG",
    "NGN", "NGT", "NHS", "NRM", "NSS", "NTW", "OT", "PE", "PF", "PLS", "PM", "PPX",
    "QF", "RVC", "RVR", "RVSS", "RVX", "SA", "SCI", "SDM", "SFI", "SPH", "SSA", "SSB",
    "SSD", "STR", "SWE", "SYE", "TDEE", "THE", "TIE", "TP", "TRA", "TX", "UD", "UIS",
    "UTC", "UTOA", "UTOB", "UTOC", "UTOD", "UTOE", "UTOM", "UTON", "UTOR", "UTS", "UTW",
    "VCU", "WR", "XD", "XFE", "YCI", "YCT", "YHU", "YIL", "YIR", "YLE", "YLG", "YLL",
    "YLN", "YLS", "YSP", "ZB", "GEH", "GESS", "GES", "GEQ", "GET"
]

# Input file path
input_file_path = r"codesandfacultyanddescription nus.json"

# Load the JSON data with UTF-8 encoding
with open(input_file_path, 'r', encoding='utf-8') as file:
    data = json.load(file)

# Function to extract letter prefix (letters before the first digit)
def get_prefix(module_code):
    match = re.match(r'^[A-Za-z]+', module_code)
    return match.group(0) if match else ''

# Filter modules with "Unknown" prefixes
unknown_modules = [
    module for module in data
    if get_prefix(module["moduleCode"]) in unknown_prefixes
]

# Save to a new JSON file named 'unknown_module_codes.json' with UTF-8 encoding
with open('unknown_module_codes.json', 'w', encoding='utf-8') as outfile:
    json.dump(unknown_modules, outfile, indent=4, ensure_ascii=False)