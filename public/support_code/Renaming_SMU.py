import json

# List of catalogue number and course name pairs
course_pairs = [
    {"catalogue_number": "900", "course_name": "PAC Elective"}
]
# Text to prepend
prepend_text = "XwewfwPAC "

# File path
file_path = r"C:\Users\Josh\Desktop\Josh's webstie\adviseekapp\public\school-data\SMU Mods AY 2024-2025 detailed.json"

# Step 1: Read the JSON file
with open(file_path, "r", encoding="utf-8") as file:
    data = json.load(file)

# Step 2: Modify the data
for item in data:
    if "Field" in item and "Field2" in item:  # Check if both fields exist
        field_value = item["Field"]
        field2_value = item["Field2"]
        # Check each pair in course_pairs
        for pair in course_pairs:
            if (field_value == pair["catalogue_number"] and 
                field2_value == pair["course_name"]):
                item["Field"] = f"{prepend_text}{item['Field']}"  # Prepend to "Field"
                break  # Stop checking once a match is found

# Step 3: Write the modified data back to the same file
with open(file_path, "w", encoding="utf-8") as file:
    json.dump(data, file, indent=4)

print(f"File 'SMU Mods AY 2024-2025 detailed.json' {prepend_text} has been updated.")