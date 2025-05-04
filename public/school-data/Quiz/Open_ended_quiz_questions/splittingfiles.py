import json
import os
import re
from collections import defaultdict

def sanitize_filename(name):
    """Convert a string to a safe filename by replacing invalid characters."""
    return re.sub(r'[^\w\-]', '_', name.strip()).strip('_')

def split_majors_to_files(input_file, output_dir):
    """Split a JSON file of majors and questions into separate files by major-school pair."""
    # Ensure output directory exists
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Read the input JSON file
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: Input file '{input_file}' not found.")
        return
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON format in '{input_file}'.")
        return
    
    # Validate input data
    if not isinstance(data, list):
        print("Error: Input JSON must be an array of objects.")
        return
    
    # Group questions by major-school pair and track criteria counts
    major_school_groups = defaultdict(list)
    criteria_counts = defaultdict(lambda: defaultdict(int))
    
    for item in data:
        # Check for required fields
        if not all(key in item for key in ['major', 'school', 'question', 'criterion']):
            print(f"Warning: Skipping invalid entry missing required fields: {item}")
            continue
        
        major = item['major'].strip()
        school = item['school'].strip()
        criterion = item['criterion'].strip()
        
        # Skip entries with empty major, school, or criterion
        if not major or not school or not criterion:
            print(f"Warning: Skipping entry with empty major, school, or criterion: {item}")
            continue
        
        # Validate criterion
        if criterion not in ['Interests', 'Skills', 'Experiences']:
            print(f"Warning: Skipping entry with invalid criterion '{criterion}': {item}")
            continue
        
        # Create unique key for major-school pair
        key = (major, school)
        major_school_groups[key].append(item)
        criteria_counts[key][criterion] += 1
    
    # Validate question counts for each major-school pair
    for key, questions in major_school_groups.items():
        major, school = key
        total_questions = len(questions)
        expected_questions = 300
        expected_per_criterion = 100
        
        if total_questions != expected_questions:
            print(f"Warning: Major '{major}' at '{school}' has {total_questions} questions, expected {expected_questions}.")
        
        for criterion in ['Interests', 'Skills', 'Experiences']:
            count = criteria_counts[key][criterion]
            if count != expected_per_criterion:
                print(f"Warning: Major '{major}' at '{school}' has {count} '{criterion}' questions, expected {expected_per_criterion}.")
    
    # Generate output files and collect manifest data
    manifest = {
        "description": "Manifest of split major-school question files",
        "files": []
    }
    
    for (major, school), questions in major_school_groups.items():
        # Create safe filename
        filename = f"{sanitize_filename(major)}_{sanitize_filename(school)}.json"
        filepath = os.path.join(output_dir, filename)
        
        # Write questions to file
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(questions, f, indent=2, ensure_ascii=False)
            print(f"Created file: {filepath} ({len(questions)} questions)")
            
            # Add to manifest
            manifest['files'].append({
                "name": filename,
                "path": filepath,
                "major": major,
                "school": school,
                "question_count": len(questions),
                "criteria_counts": {
                    "Interests": criteria_counts[(major, school)]['Interests'],
                    "Skills": criteria_counts[(major, school)]['Skills'],
                    "Experiences": criteria_counts[(major, school)]['Experiences']
                }
            })
        except Exception as e:
            print(f"Error writing file '{filepath}': {e}")
    
    # Write manifest file
    manifest_filepath = os.path.join(output_dir, 'manifest.json')
    try:
        with open(manifest_filepath, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        print(f"Created manifest: {manifest_filepath}")
    except Exception as e:
        print(f"Error writing manifest '{manifest_filepath}': {e}")

if __name__ == "__main__":
    # Configuration
    INPUT_FILE = "majors_questions.json"  # Path to your input JSON file
    OUTPUT_DIR = "output"  # Directory for output files
    
    # Run the splitting process
    split_majors_to_files(INPUT_FILE, OUTPUT_DIR)