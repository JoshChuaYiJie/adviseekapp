import json
import os

# File paths
input_file_path = r"C:\Users\Josh\Downloads\weightedmajorsNUS.json"
output_file_path = r"C:\Users\Josh\Downloads\standardized_nus_majors.json"

# Prerequisite mappings for each major (sourced from NUS admissions data)
prerequisites = {
    "Anthropology": {
        "A-Level": ["No specific subjects; humanities or social sciences preferred"],
        "IB": ["32-36 points, HL humanities or social sciences preferred"],
        "GPA": ["3.0/4.0 in any diploma, humanities-related preferred"]
    },
    "Chinese Language": {
        "A-Level": ["H1 or H2 Chinese or equivalent proficiency"],
        "IB": ["32-36 points, HL Chinese B or equivalent"],
        "GPA": ["3.0/4.0 in any diploma, language-related preferred"]
    },
    "Chinese Studies": {
        "A-Level": ["No specific subjects; Chinese proficiency preferred"],
        "IB": ["32-36 points, HL Chinese B or humanities preferred"],
        "GPA": ["3.0/4.0 in any diploma, humanities-related preferred"]
    },
    "Communications and New Media": {
        "A-Level": ["No specific subjects; humanities or arts preferred"],
        "IB": ["32-36 points, HL humanities or arts preferred"],
        "GPA": ["3.0/4.0 in any diploma, media-related preferred"]
    },
    "English Language and Linguistics": {
        "A-Level": ["No specific subjects; English or Literature preferred"],
        "IB": ["32-36 points, HL English A or Literature preferred"],
        "GPA": ["3.0/4.0 in any diploma, language-related preferred"]
    },
    "English Literature": {
        "A-Level": ["No specific subjects; Literature preferred"],
        "IB": ["32-36 points, HL English A or Literature preferred"],
        "GPA": ["3.0/4.0 in any diploma, literature-related preferred"]
    },
    "Geography": {
        "A-Level": ["No specific subjects; Geography preferred"],
        "IB": ["32-36 points, HL Geography or sciences preferred"],
        "GPA": ["3.0/4.0 in any diploma, geography-related preferred"]
    },
    "Global Studies": {
        "A-Level": ["No specific subjects; humanities or social sciences preferred"],
        "IB": ["32-36 points, HL humanities or social sciences preferred"],
        "GPA": ["3.0/4.0 in any diploma, humanities-related preferred"]
    },
    "History": {
        "A-Level": ["No specific subjects; History preferred"],
        "IB": ["32-36 points, HL History or humanities preferred"],
        "GPA": ["3.0/4.0 in any diploma, history-related preferred"]
    },
    "Japanese Studies": {
        "A-Level": ["No specific subjects; Japanese language proficiency preferred"],
        "IB": ["32-36 points, HL Japanese B or humanities preferred"],
        "GPA": ["3.0/4.0 in any diploma, language-related preferred"]
    },
    "Malay Studies": {
        "A-Level": ["No specific subjects; Malay language proficiency preferred"],
        "IB": ["32-36 points, HL Malay B or humanities preferred"],
        "GPA": ["3.0/4.0 in any diploma, language-related preferred"]
    },
    "Philosophy": {
        "A-Level": ["No specific subjects; humanities preferred"],
        "IB": ["32-36 points, HL humanities or Philosophy preferred"],
        "GPA": ["3.0/4.0 in any diploma, humanities-related preferred"]
    },
    "Political Science": {
        "A-Level": ["No specific subjects; humanities or social sciences preferred"],
        "IB": ["32-36 points, HL humanities or social sciences preferred"],
        "GPA": ["3.0/4.0 in any diploma, social sciences preferred"]
    },
    "Psychology": {
        "A-Level": ["No specific subjects; sciences or mathematics preferred"],
        "IB": ["34-38 points, HL sciences or Mathematics preferred"],
        "GPA": ["3.2/4.0 in any diploma, sciences-related preferred"]
    },
    "Social Work": {
        "A-Level": ["No specific subjects"],
        "IB": ["32-36 points, no specific HL subjects"],
        "GPA": ["3.0/4.0 in any diploma, social work-related preferred"]
    },
    "Sociology": {
        "A-Level": ["No specific subjects; social sciences preferred"],
        "IB": ["32-36 points, HL social sciences preferred"],
        "GPA": ["3.0/4.0 in any diploma, social sciences preferred"]
    },
    "South Asian Studies": {
        "A-Level": ["No specific subjects; humanities preferred"],
        "IB": ["32-36 points, HL humanities preferred"],
        "GPA": ["3.0/4.0 in any diploma, humanities-related preferred"]
    },
    "Southeast Asian Studies": {
        "A-Level": ["No specific subjects; humanities preferred"],
        "IB": ["32-36 points, HL humanities preferred"],
        "GPA": ["3.0/4.0 in any diploma, humanities-related preferred"]
    },
    "Theatre and Performance Studies": {
        "A-Level": ["No specific subjects; arts or humanities preferred"],
        "IB": ["32-36 points, HL arts or humanities preferred"],
        "GPA": ["3.0/4.0 in any diploma, arts-related preferred"]
    },
    "Economics": {
        "A-Level": ["H2 Mathematics"],
        "IB": ["34-38 points, HL Mathematics (Analysis and Approaches)"],
        "GPA": ["3.5/4.0 in any diploma, business or sciences preferred"]
    },
    "Chemistry": {
        "A-Level": ["H2 Chemistry, H2 Mathematics or Physics"],
        "IB": ["34-38 points, HL Chemistry, HL Mathematics or Physics"],
        "GPA": ["3.5/4.0 in Chemical or Science-related diploma"]
    },
    "Data Science and Analytics": {
        "A-Level": ["H2 Mathematics, H2 Physics or Computing"],
        "IB": ["34-38 points, HL Mathematics, HL Physics or Computer Science"],
        "GPA": ["3.5/4.0 in Computing or Engineering-related diploma"]
    },
    "Environmental Studies": {
        "A-Level": ["H2 Biology or Chemistry, H2 Mathematics"],
        "IB": ["34-38 points, HL Biology or Chemistry, HL Mathematics"],
        "GPA": ["3.5/4.0 in Environmental or Science-related diploma"]
    },
    "Food Science and Technology": {
        "A-Level": ["H2 Chemistry, H2 Biology or Mathematics"],
        "IB": ["34-38 points, HL Chemistry, HL Biology or Mathematics"],
        "GPA": ["3.5/4.0 in Food Science or Science-related diploma"]
    },
    "Life Sciences": {
        "A-Level": ["H2 Biology, H2 Chemistry"],
        "IB": ["34-38 points, HL Biology, HL Chemistry"],
        "GPA": ["3.5/4.0 in Biomedical or Science-related diploma"]
    },
    "Mathematics": {
        "A-Level": ["H2 Mathematics"],
        "IB": ["34-38 points, HL Mathematics (Analysis and Approaches)"],
        "GPA": ["3.5/4.0 in Mathematics or Science-related diploma"]
    },
    "Pharmaceutical Science": {
        "A-Level": ["H2 Chemistry, H2 Biology or Mathematics"],
        "IB": ["34-38 points, HL Chemistry, HL Biology or Mathematics"],
        "GPA": ["3.5/4.0 in Pharmacy or Science-related diploma"]
    },
    "Physics": {
        "A-Level": ["H2 Physics, H2 Mathematics"],
        "IB": ["34-38 points, HL Physics, HL Mathematics"],
        "GPA": ["3.5/4.0 in Physics or Engineering-related diploma"]
    },
    "Statistics": {
        "A-Level": ["H2 Mathematics"],
        "IB": ["34-38 points, HL Mathematics (Analysis and Approaches)"],
        "GPA": ["3.5/4.0 in Mathematics or Science-related diploma"]
    },
    "Architecture": {
        "A-Level": ["No specific subjects; Art or Design preferred"],
        "IB": ["34-38 points, HL Art or Design preferred"],
        "GPA": ["3.5/4.0 in Architecture or Design-related diploma"]
    },
    "Biomedical Engineering": {
        "A-Level": ["H2 Mathematics, H2 Physics or Chemistry"],
        "IB": ["34-38 points, HL Mathematics, HL Physics or Chemistry"],
        "GPA": ["3.5/4.0 in Biomedical or Engineering-related diploma"]
    },
    "Chemical Engineering": {
        "A-Level": ["H2 Mathematics, H2 Chemistry"],
        "IB": ["34-38 points, HL Mathematics, HL Chemistry"],
        "GPA": ["3.5/4.0 in Chemical or Engineering-related diploma"]
    },
    "Civil Engineering": {
        "A-Level": ["H2 Mathematics, H2 Physics"],
        "IB": ["34-38 points, HL Mathematics, HL Physics"],
        "GPA": ["3.5/4.0 in Civil or Engineering-related diploma"]
    },
    "Computer Engineering": {
        "A-Level": ["H2 Mathematics, H2 Physics or Computing"],
        "IB": ["34-38 points, HL Mathematics, HL Physics or Computer Science"],
        "GPA": ["3.5/4.0 in Computing or Engineering-related diploma"]
    },
    "Electrical Engineering": {
        "A-Level": ["H2 Mathematics, H2 Physics"],
        "IB": ["34-38 points, HL Mathematics, HL Physics"],
        "GPA": ["3.5/4.0 in Electrical or Engineering-related diploma"]
    },
    "Engineering Science": {
        "A-Level": ["H2 Mathematics, H2 Physics or Chemistry"],
        "IB": ["34-38 points, HL Mathematics, HL Physics or Chemistry"],
        "GPA": ["3.5/4.0 in Engineering or Science-related diploma"]
    },
    "Environmental Engineering": {
        "A-Level": ["H2 Mathematics, H2 Chemistry or Physics"],
        "IB": ["34-38 points, HL Mathematics, HL Chemistry or Physics"],
        "GPA": ["3.5/4.0 in Environmental or Engineering-related diploma"]
    },
    "Industrial Design": {
        "A-Level": ["No specific subjects; Art or Design preferred"],
        "IB": ["34-38 points, HL Art or Design preferred"],
        "GPA": ["3.5/4.0 in Design or Architecture-related diploma"]
    },
    "Mechanical Engineering": {
        "A-Level": ["H2 Mathematics, H2 Physics"],
        "IB": ["34-38 points, HL Mathematics, HL Physics"],
        "GPA": ["3.5/4.0 in Mechanical or Engineering-related diploma"]
    },
    "Business Analytics": {
        "A-Level": ["H2 Mathematics"],
        "IB": ["36-38 points, HL Mathematics (Analysis and Approaches)"],
        "GPA": ["3.7/4.0 in Computing or Business-related diploma"]
    },
    "Computer Science": {
        "A-Level": ["H2 Mathematics"],
        "IB": ["36-38 points, HL Mathematics (Analysis and Approaches)"],
        "GPA": ["3.7/4.0 in Computing or Engineering-related diploma"]
    },
    "Information Security": {
        "A-Level": ["H2 Mathematics"],
        "IB": ["36-38 points, HL Mathematics (Analysis and Approaches)"],
        "GPA": ["3.7/4.0 in Computing or Engineering-related diploma"]
    },
    "Information Systems": {
        "A-Level": ["H2 Mathematics"],
        "IB": ["36-38 points, HL Mathematics (Analysis and Approaches)"],
        "GPA": ["3.7/4.0 in Computing or Business-related diploma"]
    },
    "Business Administration": {
        "A-Level": ["H2 Mathematics"],
        "IB": ["36-38 points, HL Mathematics (Analysis and Approaches)"],
        "GPA": ["3.7/4.0 in Business or related diploma"]
    },
    "Real Estate": {
        "A-Level": ["H2 Mathematics"],
        "IB": ["34-38 points, HL Mathematics (Analysis and Approaches)"],
        "GPA": ["3.5/4.0 in Business or Real Estate-related diploma"]
    },
    "Law": {
        "A-Level": ["No specific subjects; strong English skills required"],
        "IB": ["38 points, HL English A (7)"],
        "GPA": ["3.7/4.0 in any diploma, strong academic record"]
    },
    "Medicine": {
        "A-Level": ["H2 Chemistry, H2 Biology or Physics"],
        "IB": ["38 points, HL Chemistry, HL Biology"],
        "GPA": ["3.8/4.0 in Biomedical or Health-related diploma"]
    },
    "Nursing": {
        "A-Level": ["H2 Biology or Chemistry"],
        "IB": ["34-38 points, HL Biology or Chemistry"],
        "GPA": ["3.5/4.0 in Health or Science-related diploma"]
    },
    "Dentistry": {
        "A-Level": ["H2 Chemistry, H2 Biology or Physics"],
        "IB": ["38 points, HL Chemistry, HL Biology"],
        "GPA": ["3.8/4.0 in Biomedical or Health-related diploma"]
    },
    "Music": {
        "A-Level": ["No specific subjects; music proficiency required"],
        "IB": ["32-36 points, HL Music preferred"],
        "GPA": ["3.0/4.0 in any diploma, music-related preferred"]
    }
}

# Function to transform NUS eligibility to SMU format
def transform_eligibility(nus_eligibility, major):
    standardized_eligibility = []
    type_mapping = {
        "A-Level": "GCE A-Level",
        "IB": "International Baccalaureate",
        "GPA": "Polytechnic GPA"
    }
    
    # Extract A-Level grades from Academic Performance
    a_level_grades = next(
        (entry["description"].replace(" or equivalent", "") for entry in nus_eligibility if entry["criterion"] == "Academic Performance"),
        "A-Level grades not specified"
    )
    
    # Get additional assessments from original eligibility
    additional_assessments = next(
        (entry["description"] for entry in nus_eligibility if entry["criterion"] == "Additional Assessments"),
        "None"
    )
    
    # Get prerequisites for the major
    major_prereqs = prerequisites.get(major, {
        "A-Level": ["No specific subjects"],
        "IB": ["32-36 points, no specific HL subjects"],
        "GPA": ["3.0/4.0 in any diploma"]
    })
    
    # Create eligibility entries
    for qual_type, requirements in major_prereqs.items():
        # Skip Indian Standard 12
        if qual_type == "Indian Standard 12":
            continue
        description = ", ".join(requirements)
        # For A-Level, prepend the grades
        if qual_type == "A-Level":
            description = f"{a_level_grades}, {description}"
        standardized_eligibility.append({
            "qualificationType": type_mapping.get(qual_type, qual_type),
            "description": description
        })
    
    # Add Additional Assessments as a separate entry
    if additional_assessments != "None":
        standardized_eligibility.append({
            "qualificationType": "Additional Assessments",
            "description": additional_assessments
        })
    else:
        standardized_eligibility.append({
            "qualificationType": "Additional Assessments",
            "description": "None"
        })
    
    return standardized_eligibility

# Read the input JSON file
try:
    with open(input_file_path, 'r') as f:
        nus_data = json.load(f)
except FileNotFoundError:
    print(f"Error: File not found at {input_file_path}")
    exit(1)
except json.JSONDecodeError:
    print("Error: Invalid JSON format in the input file")
    exit(1)

# Transform the NUS data to SMU format
standardized_programs = []
for program in nus_data["programs"]:
    standardized_program = {
        "college": program["college"],
        "major": program["major"],
        "degree": program["degree"],
        "criteria": {
            "eligibility": transform_eligibility(program["criteria"]["eligibility"], program["major"]),
            "suitability": program["criteria"]["suitability"]  # No change needed
        }
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