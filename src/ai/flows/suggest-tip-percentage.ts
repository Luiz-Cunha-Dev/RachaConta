'use server';

/**
 * @fileOverview Fluxo de IA para sugerir uma porcentagem de gorjeta com base na URL do restaurante.
 *
 * - suggestTipPercentage - Uma função que lida com o processo de sugestão de porcentagem de gorjeta.
 * - SuggestTipPercentageInput - O tipo de entrada para a função suggestTipPercentage.
 * - SuggestTipPercentageOutput - O tipo de retorno para a função suggestTipPercentage.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestTipPercentageInputSchema = z.object({
  restaurantUrl: z
    .string()
    .url()
    .describe('A URL do restaurante para análise.'),
});
export type SuggestTipPercentageInput = z.infer<
  typeof SuggestTipPercentageInputSchema
>;

const SuggestTipPercentageOutputSchema = z.object({
  suggestedTipPercentage: z
    .number()
    .min(0)
    .max(100)
    .describe('A porcentagem de gorjeta sugerida com base na URL do restaurante (Um numero inteiro de 0 a 100).'),
  reasoning: z
    .string()
    .describe(
      'A justificativa para a porcentagem de gorjeta sugerida, considerando fatores como localização e qualidade de serviço percebida.'
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
  input: { schema: SuggestTipPercentageInputSchema },
  output: { schema: SuggestTipPercentageOutputSchema },
  prompt: `Você é um assistente de IA prestativo que sugere uma porcentagem de gorjeta com base na URL de um restaurante.

  Analise a URL do restaurante e considere fatores como a localização do restaurante, a qualidade de serviço percebida (com base no conteúdo da URL) e qualquer outra informação relevante para sugerir uma porcentagem de gorjeta apropriada.

  Forneça uma breve justificativa para sua sugestão.

  URL do Restaurante: {{{restaurantUrl}}}
  `,
});

const suggestTipPercentageFlow = ai.defineFlow(
  {
    name: 'suggestTipPercentageFlow',
    inputSchema: SuggestTipPercentageInputSchema,
    outputSchema: SuggestTipPercentageOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
