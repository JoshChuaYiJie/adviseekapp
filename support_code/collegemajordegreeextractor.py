import json

# Input file path (replace with your file path)
file_path = r"C:\Users\Josh\Downloads\weightedmajorsSMU [MConverter.eu].json"  # Update this path

# Load the JSON data with UTF-8 encoding
with open(file_path, 'r', encoding='utf-8') as file:
    data = json.load(file)

# Extract college, major, and degree from programs
extracted_data = [
    {
        "college": program["college"],
        "major": program["major"],
        "degree": program["degree"]
    }
    for program in data["programs"]
]

# Save to a new JSON file named 'colleges_majors_degrees.json' with UTF-8 encoding
with open('colleges_majors_degreesSMU.json', 'w', encoding='utf-8') as outfile:
    json.dump(extracted_data, outfile, indent=4, ensure_ascii=False)