from openai import OpenAI

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key="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"
)

# Read your code from a file
code_path = "quizgenerator.py"
with open(code_path, "r", encoding="utf-8") as f:
    code_content = f.read()

while True:
    user_question = input("Ask about your code (or type 'exit'): ")
    if user_question.lower() == "exit":
        break

    prompt = f"""Here is my code:\n\n{code_content}\n\nQuestion: {user_question}\nAnswer:"""

    completion = client.chat.completions.create(
        model="nvidia/llama-3.1-nemotron-ultra-253b-v1",
        messages=[
            {"role": "system", "content": "You are a helpful assistant for Python code."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=10000,
        temperature=0.2,
        top_p=0.95,
        stream=False
    )
    print("AI:", completion.choices[0].message.content)