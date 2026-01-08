import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Plus, Trash2, User, MoreVertical, Pencil, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TEMPLATES, type Template } from '@/types/agent';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { CreateTemplateSheet } from '@/components/templates/CreateTemplateSheet';
import { EditTemplateSheet } from '@/components/templates/EditTemplateSheet';
import { DeleteTemplateDialog } from '@/components/templates/DeleteTemplateDialog';

export interface UserTemplate {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  icon: string;
  samplePrompt: string | null;
  sampleOutput: string | null;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export default function Templates() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'my-templates' | 'default-templates'>(() =>
    user ? 'my-templates' : 'default-templates'
  );
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<UserTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<UserTemplate | null>(null);

  // Keep tab synced to auth state
  useEffect(() => {
    if (!user) {
      setActiveTab('default-templates');
    }
  }, [user]);

  // Fetch user templates
  const fetchUserTemplates = useCallback(async () => {
    if (!user) {
      setUserTemplates([]);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUserTemplates(
        (data || []).map((row) => ({
          id: row.id,
          userId: row.user_id,
          name: row.name,
          description: row.description,
          icon: row.icon || '🤖',
          samplePrompt: row.sample_prompt,
          sampleOutput: row.sample_output,
          category: row.category || 'Custom',
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }))
      );
    } catch (err) {
      console.error('Error fetching user templates:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserTemplates();
    } else {
      setUserTemplates([]);
    }
  }, [user, fetchUserTemplates]);

  const handleUseTemplate = (templateId: string, isUserTemplate?: boolean) => {
    navigate('/create', { state: { templateId, isUserTemplate } });
  };

  // Get unique categories
  const allCategories = useMemo(() => {
    const defaultCats = [...new Set(TEMPLATES.map(t => t.category))];
    const userCats = [...new Set(userTemplates.map(t => t.category))];
    return [...new Set([...defaultCats, ...userCats])];
  }, [userTemplates]);

  // Filter templates by search and category
  const filteredDefaultTemplates = useMemo(() => {
    return TEMPLATES.filter(t => {
      const matchesSearch = !searchQuery || 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !categoryFilter || t.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, categoryFilter]);

  const filteredUserTemplates = useMemo(() => {
    return userTemplates.filter(t => {
      const matchesSearch = !searchQuery || 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !categoryFilter || t.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [userTemplates, searchQuery, categoryFilter]);

  const groupedDefaultTemplates = filteredDefaultTemplates.reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, typeof TEMPLATES>);

  const groupedUserTemplates = filteredUserTemplates.reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, UserTemplate[]>);

  const renderDefaultTemplateCard = (template: Template, index: number) => (
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
  );

  const renderUserTemplateCard = (template: UserTemplate, index: number) => (
    <Card
      key={template.id}
      variant="interactive"
      className="animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={() => handleUseTemplate(template.id, true)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-2xl flex-shrink-0">
            {template.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base mb-1">{template.name}</CardTitle>
              <Badge variant="secondary" className="text-xs h-5">
                <User className="w-3 h-3 mr-1" />
                Custom
              </Badge>
            </div>
            <CardDescription className="text-sm">
              {template.description || 'No description'}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setEditTemplate(template);
                }}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTemplate(template);
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {template.samplePrompt && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Sample prompt</p>
              <p className="text-sm font-medium">{template.samplePrompt}</p>
            </div>
          )}
          {template.sampleOutput && (
            <div className="p-3 rounded-lg bg-accent/30 border border-accent">
              <p className="text-xs text-muted-foreground mb-1">Sample output</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-3">
                {template.sampleOutput}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background safe-area-top">
      {/* Header */}
      <header className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Templates</h1>
              <p className="text-muted-foreground text-sm">Curated agent templates</p>
            </div>
          </div>
          {user && (
            <Button variant="hero" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4" />
              New
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-secondary/50 border-0"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-none">
          <Badge
            variant={categoryFilter === null ? "default" : "secondary"}
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setCategoryFilter(null)}
          >
            All
          </Badge>
          {allCategories.map((category) => (
            <Badge
              key={category}
              variant={categoryFilter === category ? "default" : "secondary"}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setCategoryFilter(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="px-5 pb-24">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="w-full mb-4">
            {user && (
              <TabsTrigger value="my-templates" className="flex-1 gap-2">
                <User className="w-4 h-4" />
                My Templates
                {userTemplates.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {userTemplates.length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="default-templates" className="flex-1 gap-2">
              <Sparkles className="w-4 h-4" />
              Default
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {TEMPLATES.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {user && (
            <TabsContent value="my-templates" className="mt-0">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : filteredUserTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {userTemplates.length === 0 ? "You haven't created any templates yet" : "No templates match your search"}
                  </p>
                  {userTemplates.length === 0 && (
                    <Button variant="hero" onClick={() => setCreateOpen(true)}>
                      <Plus className="w-4 h-4" />
                      Create Template
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {Object.entries(groupedUserTemplates).map(([category, templates]) => (
                    <div key={category} className="mb-8">
                      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        {category}
                      </h2>
                      <div className="space-y-3">
                        {templates.map((template, index) => renderUserTemplateCard(template, index))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </TabsContent>
          )}

          <TabsContent value="default-templates" className="mt-0">
            {filteredDefaultTemplates.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <p className="text-muted-foreground">No templates match your search</p>
              </div>
            ) : (
              Object.entries(groupedDefaultTemplates).map(([category, templates]) => (
                <div key={category} className="mb-8">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {category}
                  </h2>
                  <div className="space-y-3">
                    {templates.map((template, index) => renderDefaultTemplateCard(template, index))}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Template Sheet */}
      <CreateTemplateSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchUserTemplates}
      />

      {/* Edit Template Sheet */}
      <EditTemplateSheet
        template={editTemplate}
        open={!!editTemplate}
        onOpenChange={(open) => {
          if (!open) setEditTemplate(null);
        }}
        onSaved={fetchUserTemplates}
      />

      {/* Delete Template Dialog */}
      <DeleteTemplateDialog
        template={deleteTemplate}
        open={!!deleteTemplate}
        onOpenChange={(open) => {
          if (!open) setDeleteTemplate(null);
        }}
        onDeleted={fetchUserTemplates}
      />
    </div>
  );
}
