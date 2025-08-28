
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Shield, FileText } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import UserManagement from "@/components/UserManagement";
import SecuritySettings from "@/components/settings/SecuritySettings";
import AuditLogsSettings from "@/components/settings/AuditLogsSettings";

const Settings = () => {
  const { isAdmin, userRole, loading: roleLoading } = useUserRole();
  const canManageUsers = isAdmin; // Only Admin can manage users
  const canViewAuditLogs = isAdmin; // Only Admin can view audit logs
  const [activeTab, setActiveTab] = useState(canManageUsers ? "user-management" : "security");

  // Show loading while checking user role
  if (roleLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full ${canManageUsers ? 'grid-cols-3' : canViewAuditLogs ? 'grid-cols-2' : 'grid-cols-1'} gap-1`}>
          {canManageUsers && (
            <TabsTrigger value="user-management" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">User Management</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          {canViewAuditLogs && (
            <TabsTrigger value="audit-logs" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Audit & Logs</span>
            </TabsTrigger>
          )}
        </TabsList>

        {canManageUsers && (
          <TabsContent value="user-management" className="mt-6">
            <UserManagement />
          </TabsContent>
        )}

        <TabsContent value="security" className="mt-6">
          <SecuritySettings />
        </TabsContent>

        {canViewAuditLogs && (
          <TabsContent value="audit-logs" className="mt-6">
            <AuditLogsSettings />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Settings;
