
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { DollarSign, Percent, Users, Link as LinkIcon, Sparkles, RotateCcw, Loader2, Sun, Moon, Trash2, PlusCircle, Download, Share2, Copy, KeyRound } from "lucide-react";
import { suggestTipPercentage, type SuggestTipPercentageInput, type SuggestTipPercentageOutput } from "@/ai/flows/suggest-tip-percentage";
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

  const [userApiKey, setUserApiKey] = useState<string>("");
  const [showApiKeyDialog, setShowApiKeyDialog] = useState<boolean>(false);
  const [tempApiKey, setTempApiKey] = useState<string>("");

  useEffect(() => {
    setMounted(true);
    const storedApiKey = localStorage.getItem("googleApiKey");
    if (storedApiKey) {
      setUserApiKey(storedApiKey);
      setTempApiKey(storedApiKey);
    }
  }, []);

  const handleSaveApiKey = () => {
    localStorage.setItem("googleApiKey", tempApiKey);
    setUserApiKey(tempApiKey);
    setShowApiKeyDialog(false);
    toast({ title: "Chave de API Salva!", description: "Sua chave de API do Google AI foi salva localmente no navegador.", duration: 3000 });
  };

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

  const generateResultText = (): string => {
    let text = `Resumo da Conta - RachaConta\n\n`;
    text += `Valor da Conta: R$${parsedBillAmount.toFixed(2)}\n`;
    text += `Gorjeta (${tipPercentage}%): R$${tipAmount.toFixed(2)}\n`;
    text += `Conta Total (com Gorjeta): R$${totalBill.toFixed(2)}\n\n`;

    if (divisionMode === 'equal') {
      text += `Divisão Igual (${splitCount} pessoa${splitCount > 1 ? 's' : ''}):\n`;
      text += `Valor por Pessoa: R$${perPersonAmount.toFixed(2)}\n`;
    } else if (divisionMode === 'percentage' && individualAmounts.length > 0) {
      text += `Divisão Personalizada:\n`;
      individualAmounts.forEach(item => {
        text += `- ${item.name}: R$${item.amount.toFixed(2)}\n`;
      });
    } else if (divisionMode === 'percentage') {
      text += `Divisão Personalizada: (A soma das porcentagens deve ser 100% para calcular)\n`;
    }
    return text;
  };

  const handleDownloadResult = () => {
    if (parsedBillAmount <= 0) {
      toast({ title: "Atenção!", description: "Insira o valor da conta para baixar o resultado.", variant: "destructive", duration: 3000 });
      return;
    }
    const text = generateResultText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'racha_conta_resultado.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Download Iniciado!", description: "O arquivo com o resultado da conta foi baixado.", duration: 3000 });
  };

  const handleShareResult = async () => {
    if (parsedBillAmount <= 0) {
      toast({ title: "Atenção!", description: "Insira o valor da conta para compartilhar.", variant: "destructive", duration: 3000 });
      return;
    }
    const text = generateResultText();
    const shareData = {
      title: 'RachaConta - Resultado',
      text: text,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({ title: "Compartilhado!", description: "Resultado da conta compartilhado com sucesso.", duration: 3000 });
      } catch (err) {
        console.error("Erro ao compartilhar:", err);
        navigator.clipboard.writeText(text)
          .then(() => {
            toast({
              title: "Falha ao compartilhar",
              description: "O resultado foi copiado para a área de transferência.",
              duration: 4000,
            });
          })
          .catch(copyErr => {
            console.error("Erro ao copiar após falha no compartilhamento:", copyErr);
            toast({
              title: "Erro",
              description: "Não foi possível compartilhar nem copiar o resultado.",
              variant: "destructive",
              duration: 5000,
            });
          });
      }
    } else {
      copyToClipboard(text);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copiado!", description: "Resultado da conta copiado para a área de transferência.", duration: 3000 });
    }).catch(err => {
      console.error("Erro ao copiar:", err);
      toast({ title: "Erro ao Copiar", description: "Não foi possível copiar o resultado.", variant: "destructive", duration: 3000 });
    });
  };


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

    const currentApiKey = localStorage.getItem("googleApiKey");
    if (!currentApiKey) {
      toast({
        title: "Chave de API Necessária",
        description: "Por favor, configure sua chave de API do Google AI para usar a sugestão de gorjeta.",
        variant: "destructive",
        duration: 7000,
        action: <Button onClick={() => {
          setTempApiKey(userApiKey); // Preencher com a chave atual, se houver
          setShowApiKeyDialog(true);
        }}>Configurar Chave</Button>
      });
      return;
    }

    setIsSuggesting(true);
    setSuggestionError(null);
    setAiSuggestedTip(null);
    setAiSuggestionReasoning(null);
    try {
      const input: SuggestTipPercentageInput = { restaurantUrl, apiKey: currentApiKey };
      const result: SuggestTipPercentageOutput = await suggestTipPercentage(input);
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
      let errorMessage = error instanceof Error ? error.message : "Falha ao obter sugestão de gorjeta. Verifique a URL ou tente novamente.";
      
      // Tenta identificar erros específicos de API Key
      const errorString = String(error).toLowerCase();
      if (errorString.includes("api key") || errorString.includes("api_key_invalid") || errorString.includes("permission denied") || errorString.includes("authentication")) {
          errorMessage = "Chave de API inválida, não configurada corretamente ou com permissões insuficientes. Verifique sua chave.";
          toast({
            title: "Erro com a Chave de API",
            description: errorMessage,
            variant: "destructive",
            duration: 7000,
            action: <Button onClick={() => {
                setTempApiKey(userApiKey); // Preencher com a chave atual
                setShowApiKeyDialog(true);
            }}>Verificar Chave</Button>
          });
      } else {
          toast({ title: "Falha na Sugestão", description: errorMessage, variant: "destructive", duration: 5000 });
      }
      setSuggestionError(errorMessage);
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

  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <>
    <Card className="w-full shadow-xl bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-3xl font-headline tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            RachaConta 💸
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
                variant="outline"
                size="icon"
                onClick={() => {
                    setTempApiKey(userApiKey); // Preencher com a chave atual ao abrir
                    setShowApiKeyDialog(true);
                }}
                aria-label="Configurar Chave de API do Google AI"
                title="Configurar Chave de API do Google AI"
              >
                <KeyRound className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label="Alternar tema"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
          </div>
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
          {suggestionError && !isSuggesting && ( // Mostrar erro apenas se não estiver carregando
            <Alert variant="destructive" className="mt-2">
              <AlertTitle>Erro na Sugestão</AlertTitle>
              <AlertDescription>{suggestionError}</AlertDescription>
            </Alert>
          )}
          {aiSuggestedTip !== null && aiSuggestionReasoning && !suggestionError && !isSuggesting && (
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
          {parsedBillAmount > 0 && (
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button onClick={handleDownloadResult} variant="outline" className="flex-1">
                <Download className="mr-2 h-4 w-4" /> Baixar Resultado
              </Button>
              <Button onClick={handleShareResult} variant="outline" className="flex-1">
                {canShare ? <Share2 className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {canShare ? 'Compartilhar' : 'Copiar Resultado'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleReset} variant="outline" className="w-full border-primary text-primary hover:bg-primary/10 hover:text-primary">
          <RotateCcw className="mr-2 h-4 w-4" /> Limpar
        </Button>
      </CardFooter>
    </Card>

    <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Configurar Chave de API do Google AI</DialogTitle>
          <DialogDescription>
            Para usar a sugestão de gorjeta por IA, insira sua chave de API do Google AI Studio (Gemini).
            A chave será salva localmente no seu navegador.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <Label htmlFor="apiKeyInput">Sua Chave de API</Label>
          <Input
            id="apiKeyInput"
            type="password"
            placeholder="Cole sua chave de API aqui"
            value={tempApiKey}
            onChange={(e) => setTempApiKey(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Você pode obter uma chave de API gratuitamente no{" "}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/80">
              Google AI Studio
            </a>.
          </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSaveApiKey}>Salvar Chave</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
