import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TEMPLATES } from '@/types/agent';
import { cn } from '@/lib/utils';

export default function Templates() {
  const navigate = useNavigate();

  const handleUseTemplate = (templateId: string) => {
    navigate('/create', { state: { templateId } });
  };

  const groupedTemplates = TEMPLATES.reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, typeof TEMPLATES>);

  return (
    <div className="min-h-screen bg-background safe-area-top">
      {/* Header */}
      <header className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Templates</h1>
            <p className="text-muted-foreground text-sm">Curated agent templates</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-5 pb-24">
        {Object.entries(groupedTemplates).map(([category, templates]) => (
          <div key={category} className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {category}
            </h2>
            <div className="space-y-3">
              {templates.map((template, index) => (
                <Card
                  key={template.id}
                  variant="interactive"
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => handleUseTemplate(template.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-2xl flex-shrink-0">
                        {template.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base mb-1">{template.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {template.description}
                        </CardDescription>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Sample prompt</p>
                        <p className="text-sm font-medium">{template.samplePrompt}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-accent/30 border border-accent">
                        <p className="text-xs text-muted-foreground mb-1">Sample output</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-3">
                          {template.sampleOutput}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
