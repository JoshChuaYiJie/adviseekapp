import { ModuleRating, UserResponse, QuizQuestion } from '../types';

interface ModuleWeighting {
  moduleCode: string;
  weight: number;
}

export const calculateRecommendations = (
  moduleRatings: ModuleRating[],
  userResponses: UserResponse[],
  questions: QuizQuestion[]
): ModuleWeighting[] => {
  const moduleWeights: { [moduleCode: string]: number } = {};

  questions.forEach((question, questionIndex) => {
    const userResponse = userResponses[questionIndex];

    if (!userResponse) {
      return;
    }

    const weight = question.weight ?? 1;

    moduleRatings.forEach((moduleRating) => {
      const moduleCode = moduleRating.moduleCode;
      const rating = moduleRating.ratings[question.id];

      if (rating === undefined) {
        return;
      }

      const difference = Math.abs(rating - userResponse.response);
      const score = 1 - (difference / 4);

      if (moduleWeights[moduleCode] === undefined) {
        moduleWeights[moduleCode] = 0;
      }

      moduleWeights[moduleCode] += score * weight;
    });
  });

  const moduleWeightingArray: ModuleWeighting[] = Object.entries(moduleWeights)
    .map(([moduleCode, weight]) => ({ moduleCode, weight }))
    .sort((a, b) => b.weight - a.weight);

  return moduleWeightingArray;
};
