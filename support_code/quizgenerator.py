import os
import json
import time
import re
from collections import Counter
from openai import OpenAI

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key="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"  # Replace with your actual key or use os.getenv
)

# Set PyTorch memory management (optional, not needed for NIM API)
# os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"

# Define paths
DATA_PATH = r"C:\Users\Josh\Downloads"
NUS_MAJORS_JSON = os.path.join(DATA_PATH, "standardized_nus_majors.json")
NTU_MAJORS_JSON = os.path.join(DATA_PATH, "standardized_ntu_majors.json")
SMU_MAJORS_JSON = os.path.join(DATA_PATH, "standardized_smu_majors.json")
OUTPUT_PATH = os.path.join(DATA_PATH, "quiz_questions.json")
CHECKPOINT_PATH = os.path.join(DATA_PATH, "quiz_checkpoint.json")
INVALID_PATH = os.path.join(DATA_PATH, "invalid_questions.json")
VALID_PATH = os.path.join(DATA_PATH, "valid_questions.json")

def save_valid_question(question_data):
    existing = []
    if os.path.exists(VALID_PATH):
        with open(VALID_PATH, 'r') as f:
            existing = json.load(f)
    existing.append(question_data)
    with open(VALID_PATH, 'w') as f:
        json.dump(existing, f, indent=2)
    print(f"Saved valid question to {VALID_PATH}")

def load_majors():
    print("Loading majors from JSON files...")
    try:
        programs = []
        # Load and tag NUS majors
        with open(NUS_MAJORS_JSON, 'r') as f:
            nus_majors = json.load(f)
            for p in nus_majors["programs"]:
                criteria_descriptions = {
                    c["criterion"]: c.get("description", "No description available")
                    for c in p["criteria"].get("suitability", [])
                }
                programs.append({
                    "institution": "NUS",
                    "major": p["major"],
                    "college": p["college"],
                    "degree": p["degree"],
                    "criteria_descriptions": criteria_descriptions
                })
        # Load and tag NTU majors
        with open(NTU_MAJORS_JSON, 'r') as f:
            ntu_majors = json.load(f)
            for p in ntu_majors["programs"]:
                criteria_descriptions = {
                    c["criterion"]: c.get("description", "No description available")
                    for c in p["criteria"].get("suitability", [])
                }
                programs.append({
                    "institution": "NTU",
                    "major": p["major"],
                    "college": p["college"],
                    "degree": p["degree"],
                    "criteria_descriptions": criteria_descriptions
                })
        # Load and tag SMU majors
        with open(SMU_MAJORS_JSON, 'r') as f:
            smu_majors = json.load(f)
            for p in smu_majors["programs"]:
                criteria_descriptions = {
                    c["criterion"]: c.get("description", "No description available")
                    for c in p["criteria"].get("suitability", [])
                }
                programs.append({
                    "institution": "SMU",
                    "major": p["major"],
                    "college": p["college"],
                    "degree": p["degree"],
                    "criteria_descriptions": criteria_descriptions
                })
        print(f"Loaded {len(programs)} programs from NUS, NTU, SMU")
        return programs
    except Exception as e:
        print(f"Error loading majors: {e}")
        raise

def clean_text(text):
    text = re.sub(r'^(Answer:|Human:|Assistant:|\s*-|\s*")', '', text, flags=re.MULTILINE)
    text = re.sub(r'\b(skipping|context|task|generate a|described as)\b.*$', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\s+', ' ', text.strip())
    text = re.sub(r',\s*$', '', text)
    return text.strip()

def call_nim_llm(prompt, max_tokens=100, temperature=0.7, top_p=0.95):
    completion = client.chat.completions.create(
        model="nvidia/llama-3.1-nemotron-ultra-253b-v1",
        messages=[
            {"role": "system", "content": "You are a school admissions interviewer, your purpose is to generate questions for every major across 3 universities, national university of singapore (NUS), nanyang technological university (NTU) and singapore management university (SMU). These questions serve to deteremine how suitable people are for each major"},
            {"role": "user", "content": prompt}
        ],
        max_tokens=max_tokens,
        temperature=temperature,
        top_p=top_p,
        stream=False
    )
    return completion.choices[0].message.content

def call_nim_reward_model(question, answer, max_tokens=32):
    completion = client.chat.completions.create(
        model="nvidia/llama-3.1-nemotron-70b-reward",
        messages=[
            {"role": "user", "content": f"Score the following question and answer for relevance and quality (0-1), where 1 is the best. Consider the question's clarity, relevance to the topic, and suitability for pre-university students. Provide only the score:\nQuestion: {question}\nAnswer: {answer}\nScore:"},
            {"role": "assistant", "content": ""}
        ],
        max_tokens=max_tokens,
        temperature=0.0,
        top_p=1.0,
        stream=False
    )
    score_text = completion.choices[0].message.content.strip()
    print(f"Raw reward model output: '{score_text}'")

    try:
        # Try to extract the first float from the response
        import re
        match = re.search(r"([-+]?\d*\.?\d+)", score_text)
        if match:
            score = float(match.group(1))
            # Clamp the score between 0 and 1
            score = max(0.0, min(1.0, score))
        else:
            score = 0.0
    except Exception as e:
        print(f"Error parsing score: {e}")
        score = 0.0

    return score

def generate_text(prompt, max_new_tokens=50, max_retries=5):
    for attempt in range(max_retries):
        try:
            response = call_nim_llm(prompt, max_tokens=max_new_tokens)
            question = clean_text(response)
            print(f"Generated Question: {question}")  # Debug logging
            print(f"Question Length: {len(question.strip().split())}")  # Debug logging
            if question:
                return question
            print(f"Attempt {attempt+1}/{max_retries}: Empty question after cleaning")
        except Exception as e:
            print(f"Attempt {attempt+1}/{max_retries}: Error generating text: {e}")
    return ""

def is_valid_question(text):
    if re.search(r'\b(def|class|import|```)', text, re.IGNORECASE):
        print("Invalid question: Contains code keywords.")
        return False
    if len(text.strip().split()) < 5 or len(text.strip().split()) > 40:
        print(f"Invalid question: Length is {len(text.strip().split())} words, which is outside the 5-40 word range.")
        return False
    return True

def save_invalid_question(prompt, output, major, criterion, institution):
    invalid_data = {
        "prompt": prompt,
        "output": output,
        "major": major,
        "institution": institution,  # Add this line
        "criterion": criterion,
        "timestamp": time.time()
    }
    existing = []
    if os.path.exists(INVALID_PATH):
        with open(INVALID_PATH, 'r') as f:
            existing = json.load(f)
    existing.append(invalid_data)
    with open(INVALID_PATH, 'w') as f:
        json.dump(existing, f, indent=2)
    print(f"Saved invalid question to {INVALID_PATH}")

def load_checkpoint():
    print("Checking for existing checkpoint...")
    if os.path.exists(CHECKPOINT_PATH):
        with open(CHECKPOINT_PATH, 'r') as f:
            checkpoint = json.load(f)
        print(f"Loaded checkpoint with {len(checkpoint['data'])} samples")
        return checkpoint['data']
    print("No checkpoint found, starting fresh")
    return []

def save_checkpoint(data):
    print("Saving checkpoint...")
    checkpoint = {"data": data, "timestamp": time.time()}
    with open(CHECKPOINT_PATH, 'w') as f:
        json.dump(checkpoint, f)
    print(f"Checkpoint saved with {len(data)} samples")

def fix_question_mark(text):
    text = text.strip()
    # Remove trailing quotes, periods, or other punctuation except for ?
    while text and text[-1] not in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789?":
        text = text[:-1].strip()
    # If it doesn't end with a question mark, add one
    if not text.endswith('?'):
        text += '?'
    return text

def save_synthetic_data(data):
    print("Saving synthetic data...")
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Synthetic data saved to {OUTPUT_PATH}")

def generate_quiz_questions():
    synthetic_data = load_checkpoint()
    programs = load_majors()
    required_questions_per_criterion = 100  # Generate 100 questions per criterion

    for program in programs:
        major = program['major']
        institution = program['institution']
        criteria_descriptions = program['criteria_descriptions']

        for criterion in ['Interests', 'Skills', 'Experiences']:
            question_count = 0
            while question_count < required_questions_per_criterion:
                criterion_description = criteria_descriptions.get(criterion, "No description available")
                print(f"Generating {criterion} question for {major} at {institution}...")

                theme = f"{major} ({criterion})"

                if criterion == 'Interests':
                    prompt = (
                        f"Generate a concise question to assess a student's interest in the major '{major}' "
                        f"({institution}), focusing on {theme}. Ensure it ends with a question mark and is 5-25 words. "
                        "Ensure the question is suitable for pre-university students to answer. "
                        "Return only the question in first-person mode, as though you are actively asking the student."
                        "Ensure there is no mention of the major or institution name."
                        "Ensure the question does not assume any predefined knowledge or experience."
                        "Ensure the question ends with a question mark."
                        "Explore intresting aspects of the major, such as its relevance to the student's future career or personal growth."
                        "Explore intresting ways of framing the question, such as posing hyptothethical scenarios or asking the student to reflect on their own experiences."
                    )
                elif criterion == 'Skills':
                    prompt = (
                        f"Generate a concise question to assess a student's skills relevant to the major '{major}' "
                        f"({institution}), focusing on {theme}. Ensure it ends with a question mark and is 5-25 words. "
                        "Ensure the question is suitable for pre-university students to answer. "
                        "Return only the question in first-person mode, as though you are actively asking the student."
                        "Ensure there is no mention of the major or institution name."
                        "Ensure the question does not assume any predefined knowledge or experience." 
                        "Ensure the question ends with a question mark." 
                        "Explore intresting aspects of the major, such as its relevance to the student's future career or personal growth."
                        "Explore intresting ways of framing the question, such as posing hyptothethical scenarios or asking the student to reflect on their own experiences."                      
                    )
                else:
                    prompt = (
                        f"Generate a concise question to assess a student's experiences relevant to the major '{major}' "
                        f"({institution}), focusing on {theme}. Ensure it ends with a question mark and is 5-25 words. "
                        "Ensure the question is suitable for pre-university students to answer. "
                        "Return only the question in first-person mode, as though you are actively asking the student."
                        "Ensure there is no mention of the major or institution name."
                        "Ensure the question does not assume any predefined knowledge or experience."
                        "Ensure the question ends with a question mark."
                        "Explore intresting aspects of the major, such as its relevance to the student's future career or personal growth."
                        "Explore intresting ways of framing the question, such as posing hyptothethical scenarios or asking the student to reflect on their own experiences."   
                        )

                answer = generate_text(prompt)
                answer = fix_question_mark(answer)

                if not answer.strip() or not is_valid_question(answer):
                    print(f"Invalid or empty question generated: {answer}")
                    save_invalid_question(prompt, answer, major, criterion, institution)
                    continue

                # Call reward model for scoring
                score = call_nim_reward_model(prompt, answer)
                print(f"Generated question for {major}: {answer} (Score: {score:.2f})")

                

                # Save in the required JSON format
                synthetic_data.append({
                    'major': major,
                    'school': institution,
                    'question': answer,
                    'criterion': criterion,
                    'reward_score': score
                })
                save_valid_question({
                    'major': major,
                    'school': institution,
                    'question': answer,
                    'criterion': criterion,
                    'reward_score': score
                })
                question_count += 1

                if len(synthetic_data) % 50 == 0:
                    save_checkpoint(synthetic_data)

    save_synthetic_data(synthetic_data)
    print("Quiz question generation completed!")
    return synthetic_data

if __name__ == "__main__":
    try:
        print("Starting data generation...")
        synthetic_data = generate_quiz_questions()
        print("Process completed!")
    except Exception as e:
        import traceback
        print(f"Error: {e}")
        traceback.print_exc()