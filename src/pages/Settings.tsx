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
  Mail,
  Info,
  LogOut,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useAgentStore } from '@/store/agentStore';
import { useAuth } from '@/hooks/useAuth';
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
  const { user, signOut, deleteAccount } = useAuth();
  const cloudSyncEnabled = useAgentStore((s) => s.cloudSyncEnabled);
  const setCloudSync = useAgentStore((s) => s.setCloudSync);
  const exportData = useAgentStore((s) => s.exportData);
  const clearUserData = useAgentStore((s) => s.clearUserData);
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
    // Clear only current user's data if logged in, otherwise clear all local data
    if (user) {
      clearUserData(user.id);
      toast({ description: 'Your data cleared successfully' });
    } else {
      clearAllData();
      toast({ description: 'All local data cleared' });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleDeleteAccount = async () => {
    const { error } = await deleteAccount();
    if (!error) {
      if (user) {
        clearUserData(user.id);
      }
      navigate('/onboarding');
    }
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
        {/* Account */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Account
          </h2>
          <Card variant="default">
            <CardContent className="p-0 divide-y divide-border">
              {user ? (
                <>
                  <SettingRow
                    icon={User}
                    title={user.email || 'User'}
                    description="Signed in"
                  />
                  <SettingRow
                    icon={LogOut}
                    title="Sign out"
                    description="Sign out of your account"
                    onClick={handleSignOut}
                  />
                </>
              ) : (
                <SettingRow
                  icon={User}
                  title="Sign in"
                  description="Sign in to sync agents across devices"
                  onClick={() => navigate('/auth')}
                />
              )}
            </CardContent>
          </Card>
        </section>

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
                    disabled={!user}
                  />
                }
              />
            </CardContent>
          </Card>
          {!user && (
            <p className="text-xs text-muted-foreground mt-2 px-1">
              Sign in to enable cloud sync.
            </p>
          )}
          {cloudSyncEnabled && user && (
            <p className="text-xs text-muted-foreground mt-2 px-1">
              Your data will be securely synced to the cloud.
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
                      title="Clear my data"
                      description={user ? "Delete your agents and history" : "Delete all locally stored data"}
                      destructive
                    />
                  </div>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear your data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {user 
                        ? "This will delete your locally stored agents and history. Cloud data will remain intact if synced."
                        : "This will delete all locally stored agents and history."
                      }
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearData} className="bg-destructive text-destructive-foreground">
                      Clear data
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
              <a href="https://pocket-agent-eta.vercel.app/privacy.html" target="_blank" rel="noopener noreferrer">
              <SettingRow
                icon={Shield}
                title="Privacy Policy"
                description="How we handle your data"
                external
              />
              </a>
              <a href="https://pocket-agent-eta.vercel.app/terms.html" target="_blank" rel="noopener noreferrer">
              <SettingRow
                icon={Shield}
                title="Terms of Service"
                description="Terms and conditions"
                external
              />
              </a>
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
                description="info@floopy.store"
                onClick={() => window.open('mailto:support@floopy.store', '_blank')}
                external
              />
            </CardContent>
          </Card>
        </section>

        {/* Delete Account - Important for Play Store compliance */}
        {user && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Danger Zone
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
                      <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground">
                        Delete account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </section>
        )}
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
