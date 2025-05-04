from openai import OpenAI
import json
import os

# Configuration
client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key="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"
)
MODEL = "nvidia/llama-3.1-nemotron-ultra-253b-v1"

# Load JSON files
def load_json(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

# Save JSON output
def save_json(data, file_path):
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

# Construct prompt for mapping occupation to majors with schools
def create_prompt(occupation, majors_list):
    majors_str = ", ".join([f"{m['major']} at {m['school']}" for m in majors_list])
    prompt = (
        f"Given the occupation '{occupation}', identify the three most relevant academic majors from the following list: {majors_str}. "
        "Consider the skills, knowledge, and typical educational paths associated with the occupation. "
        "Return the three majors along with their schools in the format: 'Major1 at School1, Major2 at School2, Major3 at School3', ensure only this is returned and nothing more and nothing less. If there are less than 3 relevant majors, simply return two"
        "Return the majors in order of relevance to the occupation, the most relevant first.")
    return prompt

# Call NVIDIA Nemotron API using OpenAI client with streaming
def call_nim_api(prompt):
    try:
        stream = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful assistant for mapping occupations to academic majors."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=10000,
            temperature=0.2,
            top_p=0.95,
            stream=True
        )
        full_response = ""
        print(f"Streaming response for prompt:")
        for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                content = chunk.choices[0].delta.content
                print(content, end="", flush=True)  # Print streaming content in real-time
                full_response += content
        print()  # Newline after streaming completes
        return full_response.strip()
    except Exception as e:
        print(f"Error calling API for prompt: {e}")
        return None

# Map occupations to majors
def map_occupations_to_majors(occupations, majors):
    output = []
    for occ in occupations:
        occupation = occ["occupation"]
        prompt = create_prompt(occupation, majors)
        response = call_nim_api(prompt)
        if response:
            # Split the response into a list of major-school pairs
            mapped_pairs = [m.strip() for m in response.split(",") if m.strip()]
            # Ensure exactly 3 pairs; fallback if fewer
            if len(mapped_pairs) > 3:
                mapped_pairs = mapped_pairs[:3]
            elif len(mapped_pairs) < 3:
                mapped_pairs.extend(["Unknown at Unknown"] * (3 - len(mapped_pairs)))
        else:
            mapped_pairs = ["Unknown at Unknown", "Unknown at Unknown", "Unknown at Unknown"]
        
        # Create output entry
        entry = {
            "occupation": occupation,
            "RIASEC_code": occ["RIASEC_code"],
            "work_value_code": occ["work_value_code"],
            "majors": mapped_pairs
        }
        output.append(entry)
    return output

# Main execution
if __name__ == "__main__":
    # File paths
    occupations_file = r"C:\Users\Josh\Desktop\Josh's webstie\adviseekapp\src\contexts\quiz\quiz_refer\merged_occupations.json"
    majors_file = r"C:\Users\Josh\Desktop\Josh's webstie\adviseekapp\school-data\Standardized weights\unique_major_schools.json"
    output_file = os.path.join(os.getcwd(), "occupation_major_mappings.json")

    # Load data
    occupations = load_json(occupations_file)
    majors = load_json(majors_file)

    # Map occupations to majors
    mappings = map_occupations_to_majors(occupations, majors)

    # Save output
    save_json(mappings, output_file)
    print(f"Output saved to {output_file}")