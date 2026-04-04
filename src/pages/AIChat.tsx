import { AlertTriangle, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DisclaimerFull, DisclaimerAIResponse } from '@/components/shared/Disclaimers';

export default function AIChat() {
  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Ассистент</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Задайте вопрос по законодательству Республики Беларусь
        </p>
      </div>

      <DisclaimerFull />

      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="text-base">Чат</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-end gap-4">
          <p className="text-sm text-muted-foreground text-center py-12">
            Начните диалог — введите ваш вопрос ниже.
          </p>

          {/* Example of where DisclaimerAIResponse goes after each AI message */}
          {/* <DisclaimerAIResponse /> */}

          <div className="flex gap-2">
            <Input placeholder="Введите вопрос..." disabled />
            <Button disabled>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
