import json
import os

# File paths
input_file_path = r"C:\Users\Josh\Downloads\standardized_smu_majors.json"
output_file_path = r"C:\Users\Josh\Downloads\standardized_smu_majors.json"

# Function to update eligibility criteria with Additional Assessments
def update_eligibility_criteria(program):
    major = program["major"]
    # Get existing eligibility criteria
    eligibility = program["criteria"].get("eligibility", [])
    
    # Define Additional Assessments based on major
    if major in ["Law", "Legal Studies"]:
        description = "Interview and writing test required"
    else:
        description = "Interview required"
    
    # Append Additional Assessments to eligibility
    eligibility.append({
        "qualificationType": "Additional Assessments",
        "description": description
    })
    
    return {
        "eligibility": eligibility,
        "suitability": program["criteria"].get("suitability", [])  # Preserve existing suitability
    }

# Read the input JSON file
try:
    with open(input_file_path, 'r') as f:
        smu_data = json.load(f)
except FileNotFoundError:
    print(f"Error: File not found at {input_file_path}")
    exit(1)
except json.JSONDecodeError:
    print("Error: Invalid JSON format in the input file")
    exit(1)

# Ensure the input JSON has a 'programs' key
if "programs" not in smu_data:
    print("Error: Input JSON must contain a 'programs' key")
    exit(1)

# Transform the SMU data by updating eligibility criteria
standardized_programs = []
for program in smu_data["programs"]:
    if "criteria" not in program:
        print(f"Warning: Program {program['major']} is missing 'criteria' field. Skipping.")
        continue
    standardized_program = {
        "college": program["college"],
        "major": program["major"],
        "degree": program["degree"],
        "criteria": update_eligibility_criteria(program)
    }
    standardized_programs.append(standardized_program)

# Create the standardized JSON structure
standardized_data = {
    "programs": standardized_programs
}

# Save the result to a JSON file
try:
    with open(output_file_path, "w") as f:
        json.dump(standardized_data, f, indent=2)
    print(f"Standardized JSON saved to {output_file_path}")
except Exception as e:
    print(f"Error writing output file: {e}")

# Print the result for verification
print(json.dumps(standardized_data, indent=2))