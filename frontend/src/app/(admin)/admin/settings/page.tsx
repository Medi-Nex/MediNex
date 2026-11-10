"use client";

import React, { useEffect, useState, useTransition } from "react";
import {
  Settings,
  ShieldCheck,
  Check,
  AlertTriangle,
  RefreshCw,
  Lock,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  getAdminSettings,
  updateAdminSettings,
  AdminSettings,
} from "@/lib/api/admin";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings>({
    maintenanceMode: false,
    allowUserRegistration: true,
    requireEmailVerification: true,
    phiWarningBannerEnabled: true,
    allowedDomains: "medinex.health, healthhack2026.org",
    platformNotice: "Welcome to MediNex. Strictly zero PHI allowed on public feeds.",
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isSaving, startSaving] = useTransition();

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminSettings();
      setSettings(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load platform settings";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startSaving(async () => {
      try {
        const updated = await updateAdminSettings(settings);
        setSettings(updated);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to save settings";
        setError(msg);
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-medinex-text tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-medinex-teal" />
            <span>Platform Configuration & Security Governance</span>
          </h1>
          <p className="text-xs text-medinex-muted mt-1">
            Configure system-wide runtime switches, compliance banners, and access constraints.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSettings}
          disabled={loading}
          className="text-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Reload</span>
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Platform configuration successfully saved and recorded in audit logs.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Access & Registration Controls */}
        <Card className="border border-medinex-border">
          <CardBody className="p-5 space-y-4">
            <h2 className="text-sm font-bold text-medinex-text flex items-center gap-2 border-b border-slate-100 pb-2">
              <Lock className="w-4 h-4 text-medinex-teal" />
              <span>Access & Registration Controls</span>
            </h2>

            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowUserRegistration}
                  onChange={(e) =>
                    setSettings({ ...settings, allowUserRegistration: e.target.checked })
                  }
                  className="rounded border-slate-300 text-medinex-teal focus:ring-medinex-teal mt-0.5"
                />
                <div className="space-y-0.5">
                  <span className="font-semibold text-xs text-slate-800 block">
                    Allow Public Innovator Registration
                  </span>
                  <span className="text-[11px] text-medinex-muted block leading-relaxed">
                    When enabled, new healthcare developers and researchers can create accounts on MediNex.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.requireEmailVerification}
                  onChange={(e) =>
                    setSettings({ ...settings, requireEmailVerification: e.target.checked })
                  }
                  className="rounded border-slate-300 text-medinex-teal focus:ring-medinex-teal mt-0.5"
                />
                <div className="space-y-0.5">
                  <span className="font-semibold text-xs text-slate-800 block">
                    Mandatory Email Verification
                  </span>
                  <span className="text-[11px] text-medinex-muted block leading-relaxed">
                    Requires new registrations to confirm email address via one-time rotating token before full activation.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) =>
                    setSettings({ ...settings, maintenanceMode: e.target.checked })
                  }
                  className="rounded border-slate-300 text-medinex-teal focus:ring-medinex-teal mt-0.5"
                />
                <div className="space-y-0.5">
                  <span className="font-semibold text-xs text-slate-800 block">
                    Platform Maintenance Mode
                  </span>
                  <span className="text-[11px] text-medinex-muted block leading-relaxed">
                    Restricts public interactions and displays scheduled maintenance alerts. Only administrators retain access.
                  </span>
                </div>
              </label>
            </div>
          </CardBody>
        </Card>

        {/* Safety & Compliance Policies */}
        <Card className="border border-medinex-border">
          <CardBody className="p-5 space-y-4">
            <h2 className="text-sm font-bold text-medinex-text flex items-center gap-2 border-b border-slate-100 pb-2">
              <ShieldCheck className="w-4 h-4 text-medinex-teal" />
              <span>Healthcare Safety & Compliance Notices</span>
            </h2>

            <div className="space-y-4 text-xs">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.phiWarningBannerEnabled}
                  onChange={(e) =>
                    setSettings({ ...settings, phiWarningBannerEnabled: e.target.checked })
                  }
                  className="rounded border-slate-300 text-medinex-teal focus:ring-medinex-teal mt-0.5"
                />
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-800 block">
                    Zero-PHI Compliance Warning Banner
                  </span>
                  <span className="text-[11px] text-medinex-muted block leading-relaxed">
                    Display mandatory health data warning across post creation and discussion areas reminding users that patient data is prohibited.
                  </span>
                </div>
              </label>

              <div>
                <label className="block font-semibold text-medinex-text mb-1">
                  Public Platform Announcement Banner
                </label>
                <textarea
                  rows={2}
                  value={settings.platformNotice}
                  onChange={(e) =>
                    setSettings({ ...settings, platformNotice: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-medinex-border focus:outline-none focus:border-medinex-teal"
                  placeholder="Official notice displayed across community feed..."
                />
              </div>

              <div>
                <label className="block font-semibold text-medinex-text mb-1">
                  Permitted Email Domains for Team Admin Role Granting
                </label>
                <input
                  type="text"
                  value={settings.allowedDomains}
                  onChange={(e) =>
                    setSettings({ ...settings, allowedDomains: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-medinex-border focus:outline-none focus:border-medinex-teal"
                  placeholder="e.g. medinex.health, healthhack2026.org"
                />
                <span className="text-[10px] text-medinex-muted mt-1 block">
                  Comma-separated list of certified organization email domains.
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSaving || loading}
            className="text-xs px-6"
          >
            {isSaving ? "Saving Configuration..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
