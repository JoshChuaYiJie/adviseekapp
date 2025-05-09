import { QuizQuestion } from "@/integrations/supabase/client";

// Add an ID to each question
const addIdsToQuestions = (questions: any[], startId = 1): QuizQuestion[] => {
  return questions.map((q, index) => ({
    ...q,
    id: startId + index
  }));
};

// Interest Part 1 Questions
const interestPart1Questions = [
  {
    section: "Interest",
    question_text: "I would enjoy solving math problems and analyzing data.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Interest",
    question_text: "I am interested in understanding how things work and finding solutions to complex problems.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Interest",
    question_text: "I like conducting experiments and testing new ideas.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Interest",
    question_text: "I am curious about the natural world and enjoy learning about science and technology.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Interest",
    question_text: "I am good at paying attention to detail and following instructions carefully.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Interest",
    question_text: "I am interested in working with tools and machines to build or repair things.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Interest",
    question_text: "I enjoy working outdoors and being physically active.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Interest",
    question_text: "I am interested in learning about different cultures and customs.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Interest",
    question_text: "I am interested in helping people and making a positive impact on society.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Interest",
    question_text: "I am interested in expressing myself creatively through art, music, or writing.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Interest",
    question_text: "I enjoy working in teams and collaborating with others.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Interest",
    question_text: "I am interested in leading and managing projects.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
];

// Interest Part 2 Questions
const interestPart2Questions = [
  {
    section: "Interest",
    question_text: "I would enjoy designing buildings or structures.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Interest",
    question_text: "I am interested in understanding how the human body works.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Interest",
    question_text: "I like conducting research and analyzing data to solve problems.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Interest",
    question_text: "I am curious about the world around me and enjoy learning new things.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Interest",
    question_text: "I am good at organizing information and keeping track of details.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Interest",
    question_text: "I am interested in working with my hands to create or fix things.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Interest",
    question_text: "I enjoy spending time outdoors and being physically active.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Interest",
    question_text: "I am interested in learning about different cultures and languages.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Interest",
    question_text: "I am interested in helping others and making a difference in the world.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Interest",
    question_text: "I am interested in expressing myself through creative activities.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Interest",
    question_text: "I enjoy working with people and building relationships.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Interest",
    question_text: "I am interested in starting my own business or leading a team.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
];

// Competence Questions
const competenceQuestions = [
  {
    section: "Competence",
    question_text: "I can effectively repair electronic devices.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Competence",
    question_text: "I am skilled at analyzing complex data sets.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Competence",
    question_text: "I am proficient in creative writing and storytelling.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Competence",
    question_text: "I am capable of providing emotional support and guidance to others.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Competence",
    question_text: "I am skilled at negotiating and persuading others.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Competence",
    question_text: "I am adept at organizing and managing projects efficiently.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Competence",
    question_text: "I am competent in using tools and equipment for construction or repair.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Competence",
    question_text: "I am knowledgeable about environmental issues and conservation practices.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Competence",
    question_text: "I am skilled at resolving conflicts and mediating disputes.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Competence",
    question_text: "I am proficient in visual arts and design.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Competence",
    question_text: "I am skilled at public speaking and presenting ideas effectively.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Competence",
    question_text: "I am capable of managing budgets and financial resources.",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
];

// Work Value Questions
const workValueQuestions = [
  {
    section: "Work Values",
    question_text: "How important is it to you to feel a sense of accomplishment from your work?",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Work Values",
    question_text: "How important is it for you to have independence and autonomy in your work?",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Work Values",
    question_text: "How important is it for you to receive recognition and appreciation for your work?",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Work Values",
    question_text: "How important is it for you to have positive relationships with your coworkers?",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Work Values",
    question_text: "How important is it for you to feel that your work provides support and stability?",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Work Values",
    question_text: "How important are good working conditions to you?",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Work Values",
    question_text: "How important is it for you to have opportunities for advancement in your career?",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Work Values",
    question_text: "How important is it for you to have a job that is secure and stable?",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Work Values",
    question_text: "How important is it for you to have a job that allows you to use your creativity?",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Work Values",
    question_text: "How important is it for you to have a job that allows you to help others?",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
  {
    section: "Work Values",
    question_text: "How important is it for you to have a job that is challenging and stimulating?",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
    {
    section: "Work Values",
    question_text: "How important is it for you to have a job that is well-paid?",
    question_type: "single-select",
    options: ["1", "2", "3", "4", "5"]
  },
];

// Export the questions with IDs added
export const RIASEC_INTEREST_PART1 = addIdsToQuestions(interestPart1Questions, 1);
export const RIASEC_INTEREST_PART2 = addIdsToQuestions(interestPart2Questions, 100);
export const RIASEC_COMPETENCE = addIdsToQuestions(competenceQuestions, 200);
export const WORK_VALUES = addIdsToQuestions(workValueQuestions, 300);
