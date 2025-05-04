#im using the latest instance of the modules. from each
import json
school="NTU" #FIll in school name here
extracted_data = []

if school=="SMU":


    # Input file path (replace with your file path)
    file_path = r"C:\Users\Josh\Downloads\SMU Mods AY 2024-2025 detailed.json"  # Update this path

    # Load the JSON data with UTF-8 encoding
    with open(file_path, 'r', encoding='utf-8') as file:
        data = json.load(file)

    # Extract college, major, and degree from modules
    extracted_data = [
        {
            "modulecode": module["Field"],
            "title": module["Field2"],
            "institution": "SMU",
            "description": module["Text"]
        }
        for module in data
    ]

    # Save to a new JSON file named 'colleges_majors_degrees.json' with UTF-8 encoding
    with open('codestitleinstitutiondescriptionextractorSMU.json', 'w', encoding='utf-8') as outfile:
        json.dump(extracted_data, outfile, indent=4, ensure_ascii=False)

elif school=="NUS":
        # Input file path (replace with your file path)
    file_path = r"C:\Users\Josh\Downloads\NUS Mods AY 2024-2025 detailed.json"  # Update this path

    # Load the JSON data with UTF-8 encoding
    with open(file_path, 'r', encoding='utf-8') as file:
        data = json.load(file)

    # Extract college, major, and degree from modules
    extracted_data = [
        {
            "modulecode": module["moduleCode"],
            "title": module["title"],
            "institution": "NUS",
            "description": module["description"]
        }
        for module in data
    ]

    # Save to a new JSON file named 'colleges_majors_degrees.json' with UTF-8 encoding
    with open('codestitleinstitutiondescriptionextractorNUS.json', 'w', encoding='utf-8') as outfile:
        json.dump(extracted_data, outfile, indent=4, ensure_ascii=False)

elif school=="NTU":
            # Input file path (replace with your file path)
    file_path = r"C:\Users\Josh\Downloads\NTU Mods AY 2024-2025 detailed.json"  # Update this path

    # Load the JSON data with UTF-8 encoding
    with open(file_path, 'r', encoding='utf-8') as file:
        data = json.load(file)

    seen = set()
    # Extract college, major, and degree from modules
    for module in data: 
            code, title = module["Field3"].split(' ', 1)
            description = module["Field4"]
            key = (code, title, description)
            if key not in seen:
                seen.add(key)
                extracted_data.append({
                    "modulecode": code,
                    "title": title,
                    "institution": "NTU",
                    "description": description
                })

    # Save to a new JSON file named 'colleges_majors_degrees.json' with UTF-8 encoding
    with open('codestitleinstitutiondescriptionextractorNTU.json', 'w', encoding='utf-8') as outfile:
        json.dump(extracted_data, outfile, indent=4, ensure_ascii=False)



