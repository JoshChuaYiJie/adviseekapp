import json
import os

def merge_occupations(riasec_file, work_values_file, output_dir):
    """Merge RIASEC and Work Values JSON files by matching occupations."""
    # Ensure output directory exists
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Read RIASEC JSON
    try:
        with open(riasec_file, 'r', encoding='utf-8') as f:
            riasec_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: RIASEC file '{riasec_file}' not found.")
        return
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON format in '{riasec_file}'.")
        return
    
    # Read Work Values JSON
    try:
        with open(work_values_file, 'r', encoding='utf-8') as f:
            work_values_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: Work Values file '{work_values_file}' not found.")
        return
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON format in '{work_values_file}'.")
        return
    
    # Validate input data
    if not isinstance(riasec_data, list) or not isinstance(work_values_data, list):
        print("Error: Both input JSON files must be arrays of objects.")
        return
    
    # Create dictionaries for lookup
    riasec_dict = {}
    for item in riasec_data:
        if not all(key in item for key in ['RIASEC_code', 'occupation']):
            print(f"Warning: Skipping invalid RIASEC entry: {item}")
            continue
        occupation = item['occupation'].strip()
        if occupation:
            riasec_dict[occupation] = item['RIASEC_code']
    
    work_values_dict = {}
    for item in work_values_data:
        if not all(key in item for key in ['work_value_code', 'occupation']):
            print(f"Warning: Skipping invalid Work Values entry: {item}")
            continue
        occupation = item['occupation'].strip()
        if occupation:
            work_values_dict[occupation] = item['work_value_code']
    
    # Get all unique occupations
    all_occupations = set(riasec_dict.keys()).union(work_values_dict.keys())
    
    # Merge data
    merged_data = []
    for occupation in sorted(all_occupations):  # Sort for consistent output
        merged_data.append({
            "occupation": occupation,
            "RIASEC_code": riasec_dict.get(occupation),
            "work_value_code": work_values_dict.get(occupation)
        })
    
    # Write merged JSON output
    output_file = os.path.join(output_dir, 'merged_occupations.json')
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(merged_data, f, indent=2, ensure_ascii=False)
        print(f"Created merged JSON file: {output_file} ({len(merged_data)} entries)")
    except Exception as e:
        print(f"Error writing JSON file '{output_file}': {e}")
        return
    
    # Write manifest file
    manifest = {
        "description": "Manifest for merged RIASEC and Work Values occupations JSON",
        "file": {
            "name": "merged_occupations.json",
            "path": output_file,
            "entry_count": len(merged_data),
            "riasec_entries": len(riasec_dict),
            "work_values_entries": len(work_values_dict),
            "matched_occupations": sum(1 for d in merged_data if d['RIASEC_code'] and d['work_value_code'])
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
    RIASEC_FILE = r"C:\Users\Josh\Desktop\Josh's webstie\adviseekapp\src\contexts\quiz\quiz_refer\RIASEC_to_occupations.json"  # Path to RIASEC JSON file
    WORK_VALUES_FILE = r"C:\Users\Josh\Desktop\Josh's webstie\adviseekapp\src\contexts\quiz\quiz_refer\work_values_occupations.json"  # Path to Work Values JSON file
    OUTPUT_DIR = r"C:\Users\Josh\Desktop\Josh's webstie\adviseekapp\src\contexts\quiz\quiz_refer"
    
    # Run the merge process
    merge_occupations(RIASEC_FILE, WORK_VALUES_FILE, OUTPUT_DIR)