import json
import os

# File paths
input_file_path = r"C:\Users\Josh\Downloads\standardized_ntu_majors.json"
output_file_path = r"C:\Users\Josh\Downloads\2standardized_ntu_majors.json"

# Function to update eligibility criteria with Additional Assessments
def update_eligibility_criteria(program):
    major = program["major"]
    # Get existing eligibility criteria or create empty list
    eligibility = program.get("criteria", {}).get("eligibility", [])
    
    # Define Additional Assessments based on major
    if major == "Art, Design and Media":
        description = "Portfolio required (15-20 page PDF, videos, assignments); no interview; focus on creative submissions"
    elif major == "Medicine":
        description = "Interview required (Multiple Mini Interviews, April); no portfolio; highly competitive"
    elif major == "Renaissance Engineering":
        description = "Interview required (MMI, individual, teambuilding, March-April); no portfolio; competitive process"
    elif major == "Sport Science and Management":
        description = "Interview selective (for Maths-deficient or ABA applicants); no portfolio; case-by-case"
    elif major == "Biomedical Sciences and BioBusiness":
        description = "Interview likely (online, 6 questions, 31 minutes); no portfolio; program-specific questions"
    elif major == "Premier Scholars Programmes":
        description = "Interview likely; no portfolio; competitive selection"
    else:
        description = "No interview; no portfolio; academic-based admissions"
    
    # Append Additional Assessments to eligibility
    eligibility.append({
        "qualificationType": "Additional Assessments",
        "description": description
    })
    
    return {
        "eligibility": eligibility,
        "suitability": program.get("criteria", {}).get("suitability", [])  # Preserve or create empty suitability
    }

# Read the input JSON file
try:
    with open(input_file_path, 'r') as f:
        ntu_data = json.load(f)
except FileNotFoundError:
    print(f"Error: File not found at {input_file_path}")
    exit(1)
except json.JSONDecodeError:
    print("Error: Invalid JSON format in the input file")
    exit(1)

# Ensure the input JSON has a 'programs' key
if "programs" not in ntu_data:
    print("Error: Input JSON must contain a 'programs' key")
    exit(1)

# Transform the NTU data by updating eligibility criteria
standardized_programs = []
for program in ntu_data["programs"]:
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