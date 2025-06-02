
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DollarSign, Percent, Users, Link as LinkIcon, Sparkles, RotateCcw, Loader2, Sun, Moon, Trash2, PlusCircle } from "lucide-react";
import { suggestTipPercentage, type SuggestTipPercentageInput } from "@/ai/flows/suggest-tip-percentage";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";

interface Person {
  id: number;
  name: string;
  percentage: string;
}

interface IndividualAmount {
  name: string;
  amount: number;
}

export function TipCalculator() {
  const [billAmount, setBillAmount] = useState<string>("");
  const [tipPercentage, setTipPercentage] = useState<number>(15);
  const [splitCount, setSplitCount] = useState<number>(1);
  const [restaurantUrl, setRestaurantUrl] = useState<string>("");
  
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [aiSuggestedTip, setAiSuggestedTip] = useState<number | null>(null);
  const [aiSuggestionReasoning, setAiSuggestionReasoning] = useState<string | null>(null);

  const [divisionMode, setDivisionMode] = useState<'equal' | 'percentage'>('equal');
  const [people, setPeople] = useState<Person[]>([{ id: Date.now(), name: '', percentage: '' }]);
  const [percentageError, setPercentageError] = useState<string | null>(null);

  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const parsedBillAmount = useMemo(() => parseFloat(billAmount) || 0, [billAmount]);

  const tipAmount = useMemo(() => parsedBillAmount * (tipPercentage / 100), [parsedBillAmount, tipPercentage]);
  const totalBill = useMemo(() => parsedBillAmount + tipAmount, [parsedBillAmount, tipAmount]);

  const perPersonAmount = useMemo(() => {
    if (divisionMode === 'equal') {
      return splitCount > 0 ? totalBill / splitCount : 0;
    }
    return 0;
  }, [totalBill, splitCount, divisionMode]);

  const totalCustomPercentage = useMemo(() => {
    if (divisionMode === 'percentage') {
      return people.reduce((sum, p) => sum + (parseFloat(p.percentage) || 0), 0);
    }
    return 100;
  }, [people, divisionMode]);

  useEffect(() => {
    if (divisionMode === 'percentage') {
      const activePercentages = people.some(p => p.percentage !== '' && parseFloat(p.percentage) > 0);
      if (activePercentages && totalCustomPercentage !== 100) {
        setPercentageError(`A soma das porcentagens (${totalCustomPercentage}%) deve ser 100%.`);
      } else {
        setPercentageError(null);
      }
    } else {
      setPercentageError(null);
    }
  }, [totalCustomPercentage, divisionMode, people]);

  const individualAmounts = useMemo<IndividualAmount[]>(() => {
    if (divisionMode === 'percentage' && parsedBillAmount > 0 && totalCustomPercentage === 100) {
      return people.map((person, index) => ({
        name: person.name || `Pessoa ${index + 1}`,
        amount: totalBill * ((parseFloat(person.percentage) || 0) / 100),
      }));
    }
    return [];
  }, [divisionMode, people, totalBill, parsedBillAmount, totalCustomPercentage]);


  const handleReset = () => {
    setBillAmount("");
    setTipPercentage(15);
    setSplitCount(1);
    setRestaurantUrl("");
    setAiSuggestedTip(null);
    setAiSuggestionReasoning(null);
    setSuggestionError(null);
    setDivisionMode('equal');
    setPeople([{ id: Date.now(), name: '', percentage: '' }]);
    setPercentageError(null);
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
      setTipPercentage(result.suggestedTipPercentage); 
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

  const addPerson = () => {
    setPeople([...people, { id: Date.now(), name: '', percentage: '' }]);
  };

  const removePerson = (id: number) => {
    setPeople(people.filter(person => person.id !== id));
  };

  const updatePerson = (id: number, field: keyof Omit<Person, 'id'>, value: string) => {
    setPeople(people.map(person => 
      person.id === id ? { ...person, [field]: value } : person
    ));
  };

  if (!mounted) {
    return null; 
  }

  return (
    <Card className="w-full shadow-xl bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-3xl font-headline tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            RachaConta 💸
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label="Alternar tema"
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </div>
        <CardDescription className="text-center font-body pt-2">
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
            <Label className="flex items-center text-sm font-medium mb-2">
              <Users className="w-4 h-4 mr-2 text-accent" /> Modo de Divisão
            </Label>
            <RadioGroup
              value={divisionMode}
              onValueChange={(value: 'equal' | 'percentage') => setDivisionMode(value)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="equal" id="equal" />
                <Label htmlFor="equal">Dividir Igualmente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage">Divisão Personalizada</Label>
              </div>
            </RadioGroup>
          </div>

          {divisionMode === 'equal' && (
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
          )}

          {divisionMode === 'percentage' && (
            <div className="space-y-4 pt-2">
              <Label className="text-sm font-medium">Divisão Personalizada por Pessoa</Label>
              {people.map((person, index) => (
                <div key={person.id} className="flex items-end space-x-2">
                  <div className="flex-grow">
                    <Label htmlFor={`personName-${person.id}`} className="text-xs text-muted-foreground">Nome {index + 1}</Label>
                    <Input
                      id={`personName-${person.id}`}
                      placeholder={`Nome da Pessoa ${index + 1}`}
                      value={person.name}
                      onChange={(e) => updatePerson(person.id, 'name', e.target.value)}
                    />
                  </div>
                  <div className="w-28">
                    <Label htmlFor={`personPercentage-${person.id}`} className="text-xs text-muted-foreground">Porcentagem (%)</Label>
                    <Input
                      id={`personPercentage-${person.id}`}
                      type="number"
                      placeholder="0"
                      value={person.percentage}
                      onChange={(e) => updatePerson(person.id, 'percentage', e.target.value)}
                      min="0"
                      max="100"
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removePerson(person.id)} disabled={people.length <= 1} aria-label="Remover pessoa">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button onClick={addPerson} variant="outline" className="w-full">
                <PlusCircle className="w-4 h-4 mr-2" /> Adicionar Pessoa
              </Button>
              {percentageError && (
                <Alert variant="destructive" className="mt-2">
                  <AlertTitle>Erro na Porcentagem</AlertTitle>
                  <AlertDescription>{percentageError}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
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
            
            {divisionMode === 'equal' && (
              <div className="flex justify-between">
                <span>Valor por Pessoa:</span>
                <span className="font-medium text-accent">R${perPersonAmount.toFixed(2)}</span>
              </div>
            )}

            {divisionMode === 'percentage' && individualAmounts.length > 0 && (
              <>
                <Separator className="my-2"/>
                <h4 className="text-md font-semibold text-center text-primary/80">Valores Individuais:</h4>
                {individualAmounts.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.name}:</span>
                    <span className="font-medium text-accent">R${item.amount.toFixed(2)}</span>
                  </div>
                ))}
              </>
            )}
            {divisionMode === 'percentage' && parsedBillAmount > 0 && totalCustomPercentage !== 100 && people.some(p=> p.percentage !== '' && parseFloat(p.percentage) > 0) && (
               <Alert variant="destructive" className="mt-2 text-xs">
                  <AlertDescription>A soma das porcentagens deve ser 100% para calcular os valores individuais corretamente.</AlertDescription>
                </Alert>
            )}


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

