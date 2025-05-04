import json
import os
import re

def get_school_from_filename(filename):
    """Extract school name from filename (e.g., 'standardized_ntu_majors.json' -> 'NTU')."""
    # Extract the part after 'standardized_' and before '_majors.json'
    match = re.search(r'standardized_([^_]+)_majors\.json', os.path.basename(filename))
    if match:
        return match.group(1).upper()  # e.g., 'ntu' -> 'NTU'
    return "Unknown"

def extract_unique_major_schools(file_paths, output_dir):
    """Extract unique major-school pairs from multiple JSON files and save as JSON.
    
    Allows duplicate major names if associated with different schools (e.g., 'Accounting' at NUS and SMU).
    Ensures no duplicate major-school pairs (e.g., 'Accounting, NUS' appears only once).
    """
    # Ensure output directory exists
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Set to store unique major-school pairs
    # Using tuples (major, school) ensures uniqueness of pairs but allows duplicate majors across different schools
    unique_major_schools = set()
    
    # Process each JSON file
    for file_path in file_paths:
        school = get_school_from_filename(file_path)
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except FileNotFoundError:
            print(f"Error: File '{file_path}' not found.")
            continue
        except json.JSONDecodeError:
            print(f"Error: Invalid JSON format in '{file_path}'.")
            continue
        
        # Validate JSON structure
        if not isinstance(data, dict) or "programs" not in data or not isinstance(data["programs"], list):
            print(f"Error: File '{file_path}' does not contain a valid 'programs' array.")
            continue
        
        # Extract majors and associate with school
        for program in data["programs"]:
            if not isinstance(program, dict) or "major" not in program:
                print(f"Warning: Skipping invalid program entry in '{file_path}': {program}")
                continue
            major = program["major"].strip()
            if major:
                unique_major_schools.add((major, school))  # Pair ensures major can repeat with different schools
            else:
                print(f"Warning: Skipping empty major in '{file_path}': {program}")
    
    # Convert set to sorted list of dictionaries
    unique_major_schools_list = [
        {"major": major, "school": school}
        for major, school in sorted(unique_major_schools, key=lambda x: (x[0], x[1]))
    ]
    
    # Write JSON output
    output_file = os.path.join(output_dir, 'unique_major_schools.json')
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(unique_major_schools_list, f, indent=2, ensure_ascii=False)
        print(f"Created JSON file: {output_file} ({len(unique_major_schools_list)} major-school pairs)")
    except Exception as e:
        print(f"Error writing JSON file '{output_file}': {e}")
        return
    
    # Write manifest file
    manifest = {
        "description": "Manifest for unique major-school pairs extracted from JSON files",
        "file": {
            "name": "unique_major_schools.json",
            "path": output_file,
            "pair_count": len(unique_major_schools_list),
            "input_files": file_paths
        }
    }
    manifest_file = os.path.join(output_dir, 'manifest.json')
    try:
        with open(manifest_file, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        print(f"Created manifest: {manifest_file}")
    except Exception as e:
        print(f"Error writing manifest '{manifest_file}': {e}")

if __name__ == "__main__":
    # Configuration
    FILE_PATHS = [
        r"C:\Users\Josh\Desktop\Josh's webstie\adviseekapp\school-data\Standardized weights\standardized_ntu_majors.json",
        r"C:\Users\Josh\Desktop\Josh's webstie\adviseekapp\school-data\Standardized weights\standardized_nus_majors.json",
        r"C:\Users\Josh\Desktop\Josh's webstie\adviseekapp\school-data\Standardized weights\standardized_smu_majors.json"
    ]  # Paths to input JSON files
    OUTPUT_DIR = r"C:\Users\Josh\Desktop\Josh's webstie\adviseekapp\school-data\Standardized weights"
    
    # Run the extraction process
    extract_unique_major_schools(FILE_PATHS, OUTPUT_DIR)