import csv
import json
import os

def extract_work_values_occupations(input_file, output_dir):
    """Extract work value code and occupation name from a CSV file and save as JSON."""
    # Ensure output directory exists
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Output JSON data
    result = []
    
    # Read the CSV file
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            for row in reader:
                # Validate row has at least 4 columns
                if len(row) < 4:
                    print(f"Warning: Skipping invalid row with insufficient columns: {row}")
                    continue
                
                work_value_code = row[0].strip()
                occupation = row[3].strip()
                
                # Skip rows with empty values
                if not work_value_code or not occupation:
                    print(f"Warning: Skipping row with empty work_value_code or occupation: {row}")
                    continue
                
                # Add to result
                result.append({
                    "RIASEC_code": work_value_code,
                    "occupation": occupation
                })
    
    except FileNotFoundError:
        print(f"Error: Input file '{input_file}' not found.")
        return
    except Exception as e:
        print(f"Error reading CSV file '{input_file}': {e}")
        return
    
    # Write JSON output
    output_file = os.path.join(output_dir, 'RIASEC_to_occupations.json')
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        print(f"Created JSON file: {output_file} ({len(result)} entries)")
    except Exception as e:
        print(f"Error writing JSON file '{output_file}': {e}")
        return
    
    # Write manifest file
    manifest = {
        "description": "Manifest for work values and occupations JSON",
        "file": {
            "name": "RIASEC_to_occupations.json",
            "path": output_file,
            "entry_count": len(result)
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
    INPUT_FILE = r"C:\Users\Josh\Desktop\Josh's webstie\adviseekapp\src\contexts\quiz\quiz_refer\RIASEC_to_occupation.csv"
    OUTPUT_DIR = r"C:\Users\Josh\Desktop\Josh's webstie\adviseekapp\src\contexts\quiz\quiz_refer"
    
    # Run the extraction process
    extract_work_values_occupations(INPUT_FILE, OUTPUT_DIR)