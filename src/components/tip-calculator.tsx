
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DollarSign, Percent, Users, Link as LinkIcon, Sparkles, RotateCcw, Loader2 } from "lucide-react";
import { suggestTipPercentage, type SuggestTipPercentageInput } from "@/ai/flows/suggest-tip-percentage";
import { useToast } from "@/hooks/use-toast";

export function TipCalculator() {
  const [billAmount, setBillAmount] = useState<string>("");
  const [tipPercentage, setTipPercentage] = useState<number>(15);
  const [splitCount, setSplitCount] = useState<number>(1);
  const [restaurantUrl, setRestaurantUrl] = useState<string>("");
  
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [aiSuggestedTip, setAiSuggestedTip] = useState<number | null>(null);
  const [aiSuggestionReasoning, setAiSuggestionReasoning] = useState<string | null>(null);

  const { toast } = useToast();

  const parsedBillAmount = useMemo(() => parseFloat(billAmount) || 0, [billAmount]);

  const tipAmount = useMemo(() => parsedBillAmount * (tipPercentage / 100), [parsedBillAmount, tipPercentage]);
  const totalBill = useMemo(() => parsedBillAmount + tipAmount, [parsedBillAmount, tipAmount]);
  const perPersonAmount = useMemo(() => (splitCount > 0 ? totalBill / splitCount : 0), [totalBill, splitCount]);

  const handleReset = () => {
    setBillAmount("");
    setTipPercentage(15);
    setSplitCount(1);
    setRestaurantUrl("");
    setAiSuggestedTip(null);
    setAiSuggestionReasoning(null);
    setSuggestionError(null);
  };

  const handleSuggestTip = async () => {
    if (!restaurantUrl) {
      toast({ title: "Atenção!", description: "Por favor, insira a URL de um restaurante para obter uma sugestão de gorjeta.", variant: "destructive", duration: 3000 });
      return;
    }
    setIsSuggesting(true);
    setSuggestionError(null);
    setAiSuggestedTip(null);
    setAiSuggestionReasoning(null);
    try {
      const input: SuggestTipPercentageInput = { restaurantUrl };
      const result = await suggestTipPercentage(input);
      setAiSuggestedTip(result.suggestedTipPercentage);
      setTipPercentage(result.suggestedTipPercentage); // Apply suggested tip
      setAiSuggestionReasoning(result.reasoning);
      toast({
        title: "Sugestão de Gorjeta da IA ✨",
        description: `Gorjeta sugerida: ${result.suggestedTipPercentage}%. Motivo: ${result.reasoning}`,
        duration: 7000,
      });
    } catch (error) {
      console.error("Erro na Sugestão de Gorjeta da IA:", error);
      const errorMessage = error instanceof Error ? error.message : "Falha ao obter sugestão de gorjeta. Verifique a URL ou tente novamente.";
      setSuggestionError(errorMessage);
      toast({ title: "Falha na Sugestão", description: errorMessage, variant: "destructive", duration: 5000 });
    } finally {
      setIsSuggesting(false);
    }
  };
  
  // Debounce tip percentage input
  const [tipInput, setTipInput] = useState<string>(tipPercentage.toString());
  useEffect(() => {
    setTipInput(tipPercentage.toString());
  }, [tipPercentage]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const newTip = parseFloat(tipInput);
      if (!isNaN(newTip) && newTip >= 0 && newTip <= 100) {
        setTipPercentage(newTip);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [tipInput]);


  return (
    <Card className="w-full shadow-xl bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-center tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          RachaConta 💸
        </CardTitle>
        <CardDescription className="text-center font-body">
          Calcule e divida sua conta com facilidade. Deixe a IA ajudar com sugestões de gorjeta!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="billAmount" className="flex items-center text-sm font-medium mb-1">
              <DollarSign className="w-4 h-4 mr-2 text-accent" /> Valor da Conta
            </Label>
            <Input
              id="billAmount"
              type="number"
              placeholder="0,00"
              value={billAmount}
              onChange={(e) => setBillAmount(e.target.value)}
              className="text-base"
              min="0"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipPercentage" className="flex items-center text-sm font-medium">
              <Percent className="w-4 h-4 mr-2 text-accent" /> Porcentagem da Gorjeta
            </Label>
            <div className="flex items-center space-x-3">
              <Slider
                id="tipPercentage"
                min={0}
                max={30} 
                step={1}
                value={[tipPercentage]}
                onValueChange={(value) => {
                  setTipPercentage(value[0]);
                  setTipInput(value[0].toString());
                }}
                className="flex-grow"
              />
              <Input
                type="number"
                value={tipInput}
                onChange={(e) => setTipInput(e.target.value)}
                className="w-20 text-center text-base"
                min="0"
                max="100"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="splitCount" className="flex items-center text-sm font-medium mb-1">
              <Users className="w-4 h-4 mr-2 text-accent" /> Número de Pessoas
            </Label>
            <Input
              id="splitCount"
              type="number"
              placeholder="1"
              value={splitCount}
              onChange={(e) => setSplitCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="text-base"
              min="1"
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center font-headline">
            <Sparkles className="w-5 h-5 mr-2 text-primary" /> Sugestor de Gorjeta IA
          </h3>
          <div>
            <Label htmlFor="restaurantUrl" className="flex items-center text-sm font-medium mb-1">
              <LinkIcon className="w-4 h-4 mr-2 text-accent" /> URL do Restaurante (Opcional)
            </Label>
            <Input
              id="restaurantUrl"
              type="url"
              placeholder="https://www.exemplo-restaurante.com"
              value={restaurantUrl}
              onChange={(e) => setRestaurantUrl(e.target.value)}
              className="text-base"
            />
          </div>
          <Button onClick={handleSuggestTip} disabled={isSuggesting} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            {isSuggesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando Sugestão...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Sugerir Porcentagem de Gorjeta
              </>
            )}
          </Button>
          {suggestionError && (
            <Alert variant="destructive" className="mt-2">
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{suggestionError}</AlertDescription>
            </Alert>
          )}
          {aiSuggestedTip !== null && aiSuggestionReasoning && !suggestionError && (
             <Alert className="mt-2 border-primary/50 bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary font-semibold">Sugestão da IA Aplicada!</AlertTitle>
              <AlertDescription className="text-foreground/80">
                Gorjeta Sugerida: <strong>{aiSuggestedTip}%</strong>. {aiSuggestionReasoning}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Separator />

        <div className="space-y-3 p-4 bg-background/50 rounded-lg">
          <h3 className="text-xl font-semibold text-center font-headline text-primary">Resultados</h3>
          <div className="space-y-2 text-base">
            <div className="flex justify-between">
              <span>Valor da Gorjeta:</span>
              <span className="font-medium text-accent">R${tipAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Conta Total (com Gorjeta):</span>
              <span className="font-medium text-accent">R${totalBill.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Valor por Pessoa:</span>
              <span className="font-medium text-accent">R${perPersonAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleReset} variant="outline" className="w-full border-primary text-primary hover:bg-primary/10 hover:text-primary">
          <RotateCcw className="mr-2 h-4 w-4" /> Limpar
        </Button>
      </CardFooter>
    </Card>
  );
}
