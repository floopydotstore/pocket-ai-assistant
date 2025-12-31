import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Cloud,
  Shield,
  Download,
  Trash2,
  ExternalLink,
  ChevronRight,
  Moon,
  Mail,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useAgentStore } from '@/store/agentStore';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const cloudSyncEnabled = useAgentStore((s) => s.cloudSyncEnabled);
  const setCloudSync = useAgentStore((s) => s.setCloudSync);
  const exportData = useAgentStore((s) => s.exportData);
  const clearAllData = useAgentStore((s) => s.clearAllData);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pocketagent-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ description: 'Data exported successfully' });
  };

  const handleClearData = () => {
    clearAllData();
    toast({ description: 'All data cleared' });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background safe-area-top">
      {/* Header */}
      <header className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground text-sm">App preferences</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-5 pb-24 space-y-6">
        {/* Cloud & Sync */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Cloud & Sync
          </h2>
          <Card variant="default">
            <CardContent className="p-0">
              <SettingRow
                icon={Cloud}
                title="Cloud sync"
                description="Sync your agents across devices"
                action={
                  <Switch
                    checked={cloudSyncEnabled}
                    onCheckedChange={setCloudSync}
                  />
                }
              />
            </CardContent>
          </Card>
          {cloudSyncEnabled && (
            <p className="text-xs text-muted-foreground mt-2 px-1">
              Your data will be securely synced to the cloud. You can disable this at any time.
            </p>
          )}
        </section>

        {/* Data Management */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Data Management
          </h2>
          <Card variant="default">
            <CardContent className="p-0 divide-y divide-border">
              <SettingRow
                icon={Download}
                title="Export data"
                description="Download all your data as JSON"
                onClick={handleExport}
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <div>
                    <SettingRow
                      icon={Trash2}
                      title="Clear all data"
                      description="Delete all agents and history"
                      destructive
                    />
                  </div>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete all data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your agents, conversations, and history. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearData} className="bg-destructive text-destructive-foreground">
                      Delete all
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </section>

        {/* Legal */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Legal
          </h2>
          <Card variant="default">
            <CardContent className="p-0 divide-y divide-border">
              <SettingRow
                icon={Shield}
                title="Privacy Policy"
                description="How we handle your data"
                onClick={() => window.open('/privacy.html', '_blank')}
                external
              />
              <SettingRow
                icon={Shield}
                title="Terms of Service"
                description="Terms and conditions"
                onClick={() => window.open('/terms.html', '_blank')}
                external
              />
            </CardContent>
          </Card>
        </section>

        {/* About */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            About
          </h2>
          <Card variant="default">
            <CardContent className="p-0 divide-y divide-border">
              <SettingRow
                icon={Info}
                title="Version"
                description="1.0.0"
              />
              <SettingRow
                icon={Mail}
                title="Contact support"
                description="support@pocketagent.app"
                onClick={() => window.open('mailto:support@pocketagent.app', '_blank')}
                external
              />
            </CardContent>
          </Card>
        </section>

        {/* Delete Account - Important for Play Store compliance */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Account
          </h2>
          <Card variant="default" className="border-destructive/20">
            <CardContent className="p-0">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <div>
                    <SettingRow
                      icon={Trash2}
                      title="Delete account"
                      description="Permanently delete your account and all data"
                      destructive
                    />
                  </div>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your account and all associated data including agents, conversations, and history. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearData} className="bg-destructive text-destructive-foreground">
                      Delete account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  action,
  onClick,
  external,
  destructive,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
  onClick?: () => void;
  external?: boolean;
  destructive?: boolean;
}) {
  const content = (
    <div className="flex items-center gap-4 px-4 py-4 hover:bg-muted/50 transition-colors cursor-pointer">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${destructive ? 'bg-destructive/10' : 'bg-muted'}`}>
        <Icon className={`w-5 h-5 ${destructive ? 'text-destructive' : 'text-muted-foreground'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${destructive ? 'text-destructive' : 'text-foreground'}`}>{title}</p>
        <p className="text-sm text-muted-foreground truncate">{description}</p>
      </div>
      {action || (
        onClick && (
          external ? <ExternalLink className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )
      )}
    </div>
  );

  if (onClick && !action) {
    return <div onClick={onClick}>{content}</div>;
  }

  return content;
}
