'use server';

/**
 * @fileOverview AI flow to suggest a tip percentage based on the restaurant's URL.
 *
 * - suggestTipPercentage - A function that handles the tip percentage suggestion process.
 * - SuggestTipPercentageInput - The input type for the suggestTipPercentage function.
 * - SuggestTipPercentageOutput - The return type for the suggestTipPercentage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTipPercentageInputSchema = z.object({
  restaurantUrl: z
    .string()
    .url()
    .describe('The URL of the restaurant to analyze.'),
});
export type SuggestTipPercentageInput = z.infer<
  typeof SuggestTipPercentageInputSchema
>;

const SuggestTipPercentageOutputSchema = z.object({
  suggestedTipPercentage: z
    .number()
    .min(0)
    .max(100)
    .describe('The suggested tip percentage based on the restaurant URL.'),
  reasoning: z
    .string()
    .describe(
      'The reasoning behind the suggested tip percentage, considering factors like location and perceived service quality.'
    ),
});
export type SuggestTipPercentageOutput = z.infer<
  typeof SuggestTipPercentageOutputSchema
>;

export async function suggestTipPercentage(
  input: SuggestTipPercentageInput
): Promise<SuggestTipPercentageOutput> {
  return suggestTipPercentageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTipPercentagePrompt',
  input: {schema: SuggestTipPercentageInputSchema},
  output: {schema: SuggestTipPercentageOutputSchema},
  prompt: `You are a helpful AI assistant that suggests a tip percentage based on the URL of a restaurant.

  Analyze the restaurant's URL and consider factors such as the restaurant's location, perceived service quality (based on the URL content), and any other relevant information to suggest an appropriate tip percentage.

  Provide a brief reasoning for your suggestion.

  Restaurant URL: {{{restaurantUrl}}}
  `,
});

const suggestTipPercentageFlow = ai.defineFlow(
  {
    name: 'suggestTipPercentageFlow',
    inputSchema: SuggestTipPercentageInputSchema,
    outputSchema: SuggestTipPercentageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
