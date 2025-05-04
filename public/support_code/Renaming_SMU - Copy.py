import json

# List of numbers as strings with leading dot, preserving leading zeros
course_names = [
    "Overseas Project Experience (Sustainability Accounting)",
    "Accounting Analytics Capstone",
    "Accounting Study Mission (Asian Studies)",
    "Overseas Project Experience (Accounting in Asia)",
    "Financial Accounting",
    "Management Accounting",
    "Financial Accounting for Law",
    "Financial Accounting",
    "Management Accounting",
    "Corporate Reporting and Financial Analysis",
    "Accounting Information Systems",
    "Taxation",
    "Financial Reporting and Analysis",
    "Audit and Assurance",
    "Accounting Thought and Governance",
    "Intermediate Financial Accounting",
    "Advanced Financial Accounting",
    "Valuation",
    "Statistical Programming",
    "Strategic Management Accounting",
    "Advanced Taxation",
    "Corporate Financial Management",
    "Auditing for the Public Sector",
    "Internal Audit",
    "Advanced Audit & Assurance",
    "Insolvency and Restructuring",
    "Data Modelling and Visualisation",
    "Forecasting and Forensic Analytics",
    "Analytics for Value Investing",
    "Audit Analytics",
    "Auditing Information Systems",
    "Forensic Accounting and Investigation",
    "Cyber Risk and Forensics Work-Study Elective",
    "Accounting Data and Analytics Work-Study Elective",
    "Digital Transformation in Accounting (Personalised Learning)",
    "Guided Research in Accounting",
    "Audit and Assurance Work-Study Elective",
    "Sustainability Accounting and Reporting",
    "Financial Forensics Work-Study Elective",
    "Robotic Process Automation for Accounting",
    "Sustainability Accounting Work-Study Elective",
    "Sustainability Assurance",
    "Financial Statement Analysis",
    "Financial Accounting",
    "Financial Accounting",
    "Financial Reporting and Analysis",
    "Management Accounting",
    "Financial Accounting",
    "Corporate Reporting & Financial Analysis",
    "Advanced Financial Accounting",
    "Taxation",
    "Management Accounting",
    "Accounting Information System",
    "Audit and Assurance",
    "Financial Management",
    "Corporate Advisory",
    "Tax Planning",
    "Risk Governance",
    "Ethics and Social Responsibility",
    "Business Intelligence Analytics",
    "Strategic Financial Analysis",
    "Managing Sustainable Value Creation",
    "Financial Statement Analysis",
    "Advanced Financial Statement Analysis",
    "Accounting",
    "Applied Statistics for Data Analysis",
    "Programming with Data",
    "Data Modelling and Visualisation",
    "Managing Sustainable Value Creation",
    "Data Management",
    "Forecasting and Forensic Analytics",
    "Analytics for Financial Instruments",
    "Analytics for Value Investing",
    "Financial Reporting in the IFRS World (Part I)",
    "Financial Reporting in the IFRS World (Part II)",
    "Accounting Information System",
    "Data Modelling and Visualisation",
    "Financial Reporting in the IFRS World (Part I)",
    "Financial Reporting in the IFRS World (Part II)",
    "Blockchain and the New Economies",
    "Blockchain and the New Economies",
    "Data Thinking and Behavioral Sciences",
    "Modern AI Applications for Business",
    "Data Governance and Quality",
    "Programming with Data",
    "Modern AI Applications for Business",
    "Financial and Management Accounting",
    "Visual Analytics for Accounting",
    "Accounting Analytics Capstone – Analysis Phase",
    "Accounting Analytics Capstone – Evaluation Phase",
    "Programming for Business Analytics",
    "Sustainability Reporting",
    "Automation for Finance Transformation",
    "Financial Reporting and Governance",
    "Accounting and Governance – Theory and Practice",
    "Introduction to Accounting Research",
    "Analytical and Empirical Research in Accounting",
    "Financial Accounting",
    "Accounting and Governance – Theory and Practice",
    "Empirical Research Project I",
    "Innovation Management: Technology & Business Model",
    "Empirical Research Project II",
    "Accounting and Finance Research",
    "Information and Capital Markets",
    "Global Leadership and Organizational Behavior",
    "Research Methodologies and Their Application to Asymmetric Innovation",
    "Global Financial Markets and Institutions",
    "Introductory Research Project",
    "Firm Growth Management Research",
    "Business Strategy Research",
    "Merger Acquisition and Restructuring",
    "Data-Driven Investment and Financial Decisions",
    "Research Topics in Accounting",
    "Research Design and Methods",
    "Enterprise Risk Management",
    "Academic Writing Workshop"
]

# Text to prepend
prepend_text = "ACCT "

# File path
file_path = r"C:\Users\Josh\Desktop\Josh's webstie\adviseekapp\public\school-data\SMU Mods AY 2024-2025 detailed.json"

# Step 1: Read the JSON file
with open(file_path, "r", encoding="utf-8") as file:
    data = json.load(file)

# Step 2: Modify the data
for item in data:
    if "Field2" in item:  # Check if "Field2" exists
        field2_value = item["Field2"]
        if field2_value in course_names:  # Match against course names
            item["Field"] = f"{prepend_text}{item['Field']}"  # Prepend to "Field"

# Step 3: Write the modified data back to the same file
with open(file_path, "w", encoding="utf-8") as file:
    json.dump(data, file, indent=4)

print("File 'SMU Mods AY 2024-2025 detailed.json' has been updated.")