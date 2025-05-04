import json
import re

# Use raw string for the file path
file_path = r"C:\Users\Josh\Desktop\Josh's webstie\adviseekapp\public\school-data\SMU Mods AY 2024-2025 detailed.json"

# Load the JSON data with UTF-8 encoding
with open(file_path, 'r', encoding='utf-8') as file:
    data = json.load(file)

# Function to extract letter prefix (letters before the first digit)
def get_prefix(Field):
    match = re.match(r'^[A-Za-z]+', Field)
    return match.group(0) if match else ''

# Dictionary to store one module per unique prefix
unique_prefix_modules = {}

# Iterate through modules and keep the first module for each prefix
for module in data:
    prefix = get_prefix(module["Field"])
    if prefix and prefix not in unique_prefix_modules:
        unique_prefix_modules[prefix] = {
            "moduleCode": module["Field"],
            "name": module["Field2"],
            "description": module["Field4"]
        }

# Convert dictionary values to list for output
extracted_data = list(unique_prefix_modules.values())

# Save to a new JSON file named 'codesandfacultyanddescription nus.json' with UTF-8 encoding
with open('codesandfacultyanddescription SMU.json', 'w', encoding='utf-8') as outfile:
    json.dump(extracted_data, outfile, indent=4, ensure_ascii=False)