
// Predefined quiz questions to be inserted into the database
export const getPredefinedQuestions = () => {
  // Define the 25 questions as specified in the requirements
  return [
    // Interest section
    {
      section: "Interest",
      question_text: "Which of the following areas are you most interested in?",
      question_type: "multi-select",
      options: ["Computer Science", "Engineering", "Business and Management", "Social Sciences", "Natural Sciences", "Arts and Humanities", "Law", "Medicine and Health"]
    },
    {
      section: "Interest",
      question_text: "If you selected none of the above or have specific topics in mind, please specify.",
      question_type: "text",
      options: null
    },
    // Feasibility section
    {
      section: "Feasibility",
      question_text: "How many hours per week are you willing to dedicate to studying?",
      question_type: "single-select",
      options: ["Less than 5 hours", "5-10 hours", "10-15 hours", "More than 15 hours"]
    },
    {
      section: "Feasibility",
      question_text: "What is your preferred learning environment?",
      question_type: "single-select",
      options: ["Online", "In-person", "Hybrid"]
    },
    {
      section: "Feasibility",
      question_text: "Do you have any prior experience in the field you are interested in?",
      question_type: "single-select",
      options: ["Yes", "No"]
    },
    {
      section: "Feasibility",
      question_text: "What is your current GPA?",
      question_type: "single-select",
      options: ["Below 3.0", "3.0-3.5", "3.5-4.0", "Above 4.0"]
    },
    {
      section: "Feasibility",
      question_text: "Are you currently working?",
      question_type: "single-select",
      options: ["Yes, full-time", "Yes, part-time", "No"]
    },
    // Career Goals section
    {
      section: "Career Goals",
      question_text: "What are your primary career goals?",
      question_type: "multi-select",
      options: ["Start my own business", "Work in a large corporation", "Work in a small company", "Work in a non-profit organization", "Pursue further education", "Other"]
    },
    {
      section: "Career Goals",
      question_text: "Which industries are you most interested in?",
      question_type: "multi-select",
      options: ["Technology", "Finance", "Healthcare", "Education", "Government", "Arts and Entertainment", "Other"]
    },
    {
      section: "Career Goals",
      question_text: "What kind of salary are you expecting after graduation?",
      question_type: "single-select",
      options: ["Less than $50,000", "$50,000 - $75,000", "$75,000 - $100,000", "More than $100,000"]
    },
    {
      section: "Career Goals",
      question_text: "What is your preferred work-life balance?",
      question_type: "single-select",
      options: ["Work-life balance is very important", "I am willing to sacrifice work-life balance for career advancement", "I am not sure"]
    },
    {
      section: "Career Goals",
      question_text: "What is your preferred job location?",
      question_type: "single-select",
      options: ["Singapore", "Overseas", "Remote"]
    },
    // Learning Style section
    {
      section: "Learning Style",
      question_text: "What is your preferred learning style?",
      question_type: "single-select",
      options: ["Visual", "Auditory", "Kinesthetic", "Reading/Writing"]
    },
    {
      section: "Learning Style",
      question_text: "Do you prefer to work in groups or individually?",
      question_type: "single-select",
      options: ["Groups", "Individually"]
    },
    {
      section: "Learning Style",
      question_text: "Do you prefer to learn through lectures or hands-on activities?",
      question_type: "single-select",
      options: ["Lectures", "Hands-on activities"]
    },
    {
      section: "Learning Style",
      question_text: "Do you prefer to learn through theory or practice?",
      question_type: "single-select",
      options: ["Theory", "Practice"]
    },
    {
      section: "Learning Style",
      question_text: "Do you prefer to learn through structured or unstructured environments?",
      question_type: "single-select",
      options: ["Structured", "Unstructured"]
    },
    // Additional questions to reach 25
    {
      section: "Interest",
      question_text: "Are you interested in courses that involve a lot of writing?",
      question_type: "single-select",
      options: ["Yes", "No"]
    },
    {
      section: "Interest",
      question_text: "Are you interested in courses that involve a lot of math?",
      question_type: "single-select",
      options: ["Yes", "No"]
    },
    {
      section: "Feasibility",
      question_text: "Are you willing to take courses that are outside of your major?",
      question_type: "single-select",
      options: ["Yes", "No"]
    },
    {
      section: "Feasibility",
      question_text: "Are you willing to take courses that are more difficult than your current level?",
      question_type: "single-select",
      options: ["Yes", "No"]
    },
    {
      section: "Career Goals",
      question_text: "Are you interested in courses that will help you develop your leadership skills?",
      question_type: "single-select",
      options: ["Yes", "No"]
    },
    {
      section: "Career Goals",
      question_text: "Are you interested in courses that will help you develop your communication skills?",
      question_type: "single-select",
      options: ["Yes", "No"]
    },
    {
      section: "Learning Style",
      question_text: "Do you prefer to learn through visual aids such as videos and diagrams?",
      question_type: "single-select",
      options: ["Yes", "No"]
    }
  ];
};
