
'use server';
/**
 * @fileOverview Fluxo de IA para sugerir uma porcentagem de gorjeta com base na URL do restaurante.
 *
 * - suggestTipPercentage - Uma função que lida com o processo de sugestão de porcentagem de gorjeta.
 * - SuggestTipPercentageInput - O tipo de entrada para a função suggestTipPercentage.
 * - SuggestTipPercentageOutput - O tipo de retorno para a função suggestTipPercentage.
 */

import { ai as globalAi } from '@/ai/genkit';
import { genkit, type GenerateOptions } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';

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

const SuggestTipPercentageInputSchema = z.object({
  restaurantUrl: z
    .string()
    .url()
    .describe('A URL do restaurante para análise.'),
  apiKey: z.string().optional().describe('Chave de API do Google AI (opcional, usada se fornecida).'),
});
export type SuggestTipPercentageInput = z.infer<
  typeof SuggestTipPercentageInputSchema
>;

export async function suggestTipPercentage(
  input: SuggestTipPercentageInput
): Promise<SuggestTipPercentageOutput> {
  return suggestTipPercentageFlow(input);
}

const TIP_SUGGESTION_PROMPT_TEMPLATE = `Você é um assistente de IA prestativo que sugere uma porcentagem de gorjeta com base na URL de um restaurante.
  Analise a URL do restaurante e considere fatores como a localização do restaurante, a qualidade de serviço percebida (com base no conteúdo da URL) e qualquer outra informação relevante para sugerir uma porcentagem de gorjeta apropriada.
  Forneça uma breve justificativa para sua sugestão.
  URL do Restaurante: {{{restaurantUrl}}}`;

const suggestTipPercentageFlow = globalAi.defineFlow(
  {
    name: 'suggestTipPercentageFlow',
    inputSchema: SuggestTipPercentageInputSchema,
    outputSchema: SuggestTipPercentageOutputSchema,
  },
  async (input) => {
    const { restaurantUrl, apiKey } = input;
    const modelId = 'googleai/gemini-1.5-flash-latest';

    const generateOptionsBase: Omit<GenerateOptions, 'model'> = {
      prompt: TIP_SUGGESTION_PROMPT_TEMPLATE,
      input: { restaurantUrl },
      output: { schema: SuggestTipPercentageOutputSchema },
      config: {},
    };
    
    let resultOutput;

    try {
      if (apiKey) {
        const localAi = genkit({ 
          plugins: [googleAI({ apiKey })],
        });
        const response = await localAi.generate({
          ...generateOptionsBase,
          model: modelId, 
        });
        resultOutput = response.output;
      } else {
        const response = await globalAi.generate({
          ...generateOptionsBase,
          model: modelId,
        });
        resultOutput = response.output;
      }
    } catch (flowError) {
      console.error("Erro no fluxo Genkit (suggestTipPercentageFlow):", flowError);
      if (flowError instanceof Error) {
        throw new Error(`Falha na sugestão da IA: ${flowError.message}`);
      }
      throw new Error("Falha na sugestão da IA devido a um erro desconhecido no fluxo.");
    }

    if (!resultOutput) {
      throw new Error("A IA não retornou um resultado válido (nulo ou indefinido).");
    }

    try {
      // Valida explicitamente o output com o schema Zod
      const parsedOutput = SuggestTipPercentageOutputSchema.parse(resultOutput);
      return parsedOutput;
    } catch (parseError) {
      console.error("Falha na validação do schema do output da IA:", parseError, "Output recebido:", resultOutput);
      throw new Error("A IA retornou um resultado com formato inesperado.");
    }
  }
);
