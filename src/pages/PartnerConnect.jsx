import { useState, useEffect } from "react";
import {
  Users,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  WifiOff,
  RefreshCw,
  QrCode,
  Copy,
  Check,
  Eye,
  Sliders,
  Sparkles,
  ArrowRight,
  UserMinus,
  Lock,
  Download,
  Upload,
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { Btn, Card, cx } from "@/components/common/ui.jsx";
import {
  loadPartnerState,
  createPartnerInvitation,
  joinAsPartner,
  confirmOwnerPairing,
  syncOwnerSnapshot,
  fetchPartnerSnapshot,
  revokePartnerSharing,
  exportManualEncryptedSnapshot,
  importManualEncryptedSnapshot,
} from "@/lib/partnerClient.ts";
import { DEFAULT_PARTNER_PERMISSIONS } from "@/lib/partner.ts";

export function PartnerConnectPage() {
  const { t, record, analysis, identity, isOnline } = useApp();

  const [partnerState, setPartnerState] = useState(null);
  const [activeTab, setActiveTab] = useState("owner");
  const [permissions, setPermissions] = useState(DEFAULT_PARTNER_PERMISSIONS);
  const [partnerName, setPartnerName] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [partnerJoinCode, setPartnerJoinCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [partnerSnapshot, setPartnerSnapshot] = useState(null);
  const [isSnapshotStale, setIsSnapshotStale] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState("");
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const refreshState = async () => {
    const s = await loadPartnerState();
    setPartnerState(s);
    if (s.permissions) setPermissions(s.permissions);
    if (s.status === "paired" && s.sharedKeyB64) {
      try {
        const fetched = await fetchPartnerSnapshot();
        if (fetched.snapshot) {
          setPartnerSnapshot(fetched.snapshot);
          setIsSnapshotStale(fetched.isStale);
          setLastSyncTime(fetched.lastSyncedAt);
        }
      } catch {
        // Offline or not paired
      }
    }
  };

  useEffect(() => {
    refreshState();
  }, []);

  const handleCreateInvite = async () => {
    setBusy(true);
    setErrMsg("");
    setStatusMsg("");
    try {
      const { invitationCode: code } = await createPartnerInvitation(
        permissions,
        partnerName || "Partner",
      );
      setInvitationCode(code);
      setStatusMsg(
        t("partner.inviteCreated") || "Temporary invitation generated (valid for 15 minutes).",
      );
      await refreshState();
    } catch (e) {
      setErrMsg(e.message || "Failed to create invitation");
    } finally {
      setBusy(false);
    }
  };

  const handleJoinPartner = async () => {
    if (!partnerJoinCode.trim()) return;
    setBusy(true);
    setErrMsg("");
    setStatusMsg("");
    try {
      const res = await joinAsPartner(partnerJoinCode.trim().toUpperCase());
      setVerificationCode(res.verificationCode);
      setStatusMsg(
        t("partner.pairedSuccess") ||
          "Paired successfully! Confirm the 6-digit verification code with your partner.",
      );
      await refreshState();
    } catch (e) {
      setErrMsg(e.message || "Failed to join using invitation code.");
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async () => {
    if (
      !confirm(
        t("partner.confirmRevoke") ||
          "Are you sure you want to disconnect your partner? They will immediately lose access to all shared cycle updates.",
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await revokePartnerSharing();
      setPartnerSnapshot(null);
      setInvitationCode("");
      await refreshState();
      setStatusMsg(t("partner.revokedSuccess") || "Partner connection revoked.");
    } catch (e) {
      setErrMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const copyToClipboard = (text) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary mb-2">
            <Users className="h-3.5 w-3.5" />
            <span>{t("partner.badge") || "Saheli Partner Connect (E2EE)"}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("partner.title") || "Partner Connect"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("partner.subtitle") ||
              "Secure, end-to-end encrypted companion view. 100% voluntary, read-only for partners."}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="inline-flex rounded-2xl bg-muted/60 p-1 border border-border/40">
          <button
            type="button"
            onClick={() => setActiveTab("owner")}
            className={cx(
              "px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
              activeTab === "owner"
                ? "bg-card text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t("partner.tabOwner") || "I am the Cycle Owner"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("partner")}
            className={cx(
              "px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
              activeTab === "partner"
                ? "bg-card text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t("partner.tabPartner") || "I am a Partner"}
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          role="status"
          className="flex items-center gap-2 p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-xs text-primary font-medium"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errMsg && (
        <div
          role="alert"
          className="flex items-center gap-2 p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errMsg}</span>
        </div>
      )}

      {/* OWNER EXPERIENCE */}
      {activeTab === "owner" && (
        <div className="space-y-6">
          {/* Privacy & Safeguard Banner */}
          <div className="rounded-3xl border border-primary/20 bg-primary/5 p-5 space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Shield className="h-4.5 w-4.5" />
              <span>
                {t("partner.privacyGuaranteeTitle") || "End-to-End Encryption & Privacy Guarantee"}
              </span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1.5 pl-6 list-disc">
              <li>
                {t("partner.guarantee1") ||
                  "Records are encrypted on your phone with keys known only to you and your partner."}
              </li>
              <li>
                {t("partner.guarantee2") ||
                  "Partners have read-only access. They cannot edit, add, or delete your cycle data."}
              </li>
              <li>
                {t("partner.guarantee3") ||
                  "Private diary notes and unapproved symptoms are strictly excluded by default."}
              </li>
              <li>
                {t("partner.guarantee4") ||
                  "You can revoke sharing at any time with immediate effect."}
              </li>
            </ul>
          </div>

          {/* In-Memory Relay & Air-Gapped Notice */}
          <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>In-Memory Ephemeral Relay & Air-Gapped Mode</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Live pairing synchronizes through an in-memory ephemeral relay that operates during
              active sessions. For durable, 100% air-gapped sharing without relying on any network
              relay, export and import pre-encrypted <code>.sahelipartner</code> snapshots.
            </p>
          </div>

          {/* Connection Status Card */}
          {partnerState?.status === "paired" ? (
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 font-bold">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {partnerState.partnerName || "Connected Partner"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isOnline
                        ? t("partner.statusLive") || "Active Partner Connection (Online)"
                        : t("partner.statusOffline") || "Offline: Updates will sync on reconnect"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Btn
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setBusy(true);
                      setErrMsg("");
                      try {
                        const jsonStr = await exportManualEncryptedSnapshot(
                          record,
                          permissions,
                          analysis,
                        );
                        const blob = new Blob([jsonStr], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `saheli-partner-snapshot-${new Date().toISOString().slice(0, 10)}.sahelipartner`;
                        a.click();
                        URL.revokeObjectURL(url);
                        setStatusMsg("Encrypted .sahelipartner snapshot exported.");
                      } catch (e) {
                        setErrMsg(e.message || "Failed to export partner snapshot");
                      } finally {
                        setBusy(false);
                      }
                    }}
                    disabled={busy}
                    className="text-xs font-bold"
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    <span>Export .sahelipartner</span>
                  </Btn>
                  <Btn
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewOpen(!previewOpen)}
                    className="text-xs"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    {previewOpen
                      ? t("partner.hidePreview") || "Hide Preview"
                      : t("partner.preview") || "Partner Preview"}
                  </Btn>
                  <Btn
                    variant="destructive"
                    size="sm"
                    onClick={handleRevoke}
                    disabled={busy}
                    className="text-xs"
                  >
                    <UserMinus className="h-3.5 w-3.5 mr-1" />
                    {t("partner.revoke") || "Disconnect"}
                  </Btn>
                </div>
              </div>

              {partnerState.verificationCode && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/40 text-xs">
                  <span className="text-muted-foreground">
                    {t("partner.sasLabel") || "Security Verification Code (SAS):"}
                  </span>
                  <span className="font-mono font-bold text-primary tracking-widest text-sm">
                    {partnerState.verificationCode}
                  </span>
                </div>
              )}

              {/* Live Preview Modal / Drawer */}
              {previewOpen && (
                <div className="mt-4 p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-3 animate-in fade-in">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    {t("partner.previewHeader") || "What Your Partner Sees"}
                  </h4>
                  <div className="p-3 bg-card rounded-xl border border-border/40 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("partner.cycleDay")}:</span>
                      <span className="font-semibold text-foreground">
                        {t("ins.dayLabel")} {analysis?.currentCycleDay || 14}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("partner.phase")}:</span>
                      <span className="font-semibold text-foreground">
                        {analysis?.phaseName || "Ovulatory"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("partner.nextEstimatedPeriod")}:
                      </span>
                      <span className="font-semibold text-foreground">
                        {permissions.periodEstimates
                          ? analysis?.prediction?.expectedStart || "In ~14 days"
                          : "Hidden"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("partner.privateNotesLabel")}:
                      </span>
                      <span className="text-emerald-600 font-bold">
                        {t("partner.excludedProtected")}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Setup & Invitation Section */
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  {t("partner.setupTitle") || "Invite a Partner"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t("partner.setupDesc") ||
                    "Select the exact information you wish to share, then generate a temporary pairing code."}
                </p>
              </div>

              {/* Partner Name Input */}
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  {t("partner.nameLabel") || "Partner Name / Alias"}
                </label>
                <input
                  type="text"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder={t("partner.namePlaceholder")}
                  className="w-full max-w-sm rounded-xl border border-input bg-background/50 px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              {/* Field-Level Permissions Selector */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-primary" />
                  <span>{t("partner.permissionsTitle") || "Field-Level Sharing Permissions"}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: "periodDates",
                      label: "Logged Period Dates",
                      desc: "Start and end dates of menstruation",
                    },
                    {
                      id: "calendar",
                      label: "Cycle Calendar",
                      desc: "General calendar status without symptom notes",
                    },
                    {
                      id: "cycleHistory",
                      label: "Cycle Length Statistics",
                      desc: "Average duration and total cycle count",
                    },
                    {
                      id: "periodEstimates",
                      label: "Next Period Predictions",
                      desc: "Approximate timing of upcoming cycle",
                    },
                    {
                      id: "cycleEducation",
                      label: "Cycle Phase Guidance",
                      desc: "General phase explanations",
                    },
                    {
                      id: "wellnessUpdates",
                      label: "Wellness Habits",
                      desc: "Hydration and sleep milestones",
                    },
                    {
                      id: "symptoms",
                      label: "General Symptoms",
                      desc: "Cramps or mood checkins (Default: OFF)",
                    },
                  ].map((item) => (
                    <label
                      key={item.id}
                      className="flex items-start gap-3 p-3 rounded-2xl border border-border/50 bg-background/40 hover:bg-muted/40 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(permissions[item.id])}
                        onChange={(e) =>
                          setPermissions((p) => ({ ...p, [item.id]: e.target.checked }))
                        }
                        className="mt-0.5 rounded border-input text-primary focus:ring-primary h-4 w-4"
                      />
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-foreground">{item.label}</div>
                        <div className="text-[11px] text-muted-foreground">{item.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Excluded by default notice */}
                <div className="p-3 rounded-2xl bg-muted/40 border border-border/40 text-[11px] text-muted-foreground flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>
                    {t("partner.strictlyExcludedNotice") ||
                      "Private diary notes, fertility ovulation windows (under 18), and AI chats are strictly excluded from partner sharing."}
                  </span>
                </div>
              </div>

              {/* Generate Invite Button */}
              <div>
                <Btn
                  onClick={handleCreateInvite}
                  disabled={busy}
                  className="rounded-2xl px-5 py-2.5 text-xs font-bold"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {busy
                    ? t("common.loading")
                    : t("partner.generateInviteBtn") || "Generate 15-Minute Invitation Code"}
                </Btn>
              </div>

              {/* Display Invitation Code if Active */}
              {invitationCode && (
                <div className="p-5 rounded-2xl bg-accent/40 border border-border space-y-3 animate-in fade-in">
                  <div className="text-xs font-bold text-foreground">
                    {t("partner.shareInstructions") ||
                      "Share this temporary invitation code with your partner:"}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-4 py-2 rounded-xl bg-card border font-mono font-bold text-base tracking-widest text-primary">
                      {invitationCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(invitationCode)}
                      className="p-2 rounded-xl border border-input bg-card text-muted-foreground hover:text-foreground cursor-pointer"
                      aria-label={t("partner.copyInviteAria")}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {t("partner.inviteExpiryNotice") ||
                      "Expires in 15 minutes. Once paired, your partner will only receive encrypted data matching your selected permissions."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* PARTNER EXPERIENCE */}
      {activeTab === "partner" && (
        <div className="space-y-6">
          {partnerSnapshot ? (
            /* Read-Only Partner Dashboard */
            <div className="space-y-6 animate-in fade-in">
              <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
                  <div>
                    <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                      {t("partner.readOnlyView") || "Partner Companion View · Read Only"}
                    </div>
                    <h2 className="text-xl font-bold text-foreground">
                      {t("partner.cycleOverview") || "Cycle Summary"}
                    </h2>
                  </div>

                  {/* Sync status chip */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-3 py-1 rounded-full bg-muted/60 border border-border/40">
                    <Clock className="h-3 w-3" />
                    <span>
                      {lastSyncTime
                        ? `${t("partner.lastSync") || "Synced:"} ${new Date(lastSyncTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                        : "Cached offline"}
                    </span>
                    {isSnapshotStale && (
                      <span className="text-amber-500 font-bold ml-1">
                        ({t("partner.stale") || "Offline"})
                      </span>
                    )}
                  </div>
                </div>

                {/* Shared Cycle Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 text-center space-y-1">
                    <div className="text-[11px] text-muted-foreground uppercase">
                      {t("partner.avgCycle") || "Average Cycle"}
                    </div>
                    <div className="text-base font-bold text-foreground">
                      {partnerSnapshot.data.cycleStats?.median || 28} {t("insights.days")}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 text-center space-y-1">
                    <div className="text-[11px] text-muted-foreground uppercase">
                      {t("partner.avgPeriod") || "Period Length"}
                    </div>
                    <div className="text-base font-bold text-foreground">
                      ~{partnerSnapshot.data.cycleStats?.avgPeriod || 5} {t("insights.days")}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 text-center space-y-1">
                    <div className="text-[11px] text-muted-foreground uppercase">
                      {t("partner.phase") || "Current Phase"}
                    </div>
                    <div className="text-base font-bold text-primary">
                      {partnerSnapshot.data.education?.currentPhase || "Active"}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 text-center space-y-1">
                    <div className="text-[11px] text-muted-foreground uppercase">
                      {t("partner.nextPeriod") || "Next Period"}
                    </div>
                    <div className="text-base font-bold text-foreground">
                      {partnerSnapshot.data.prediction?.nextDate || "Estimated soon"}
                    </div>
                  </div>
                </div>

                {/* Disconnect Control */}
                <div className="pt-2 flex justify-end">
                  <Btn variant="outline" size="sm" onClick={handleRevoke} className="text-xs">
                    {t("partner.disconnectPartner") || "Disconnect Partner View"}
                  </Btn>
                </div>
              </div>
            </div>
          ) : (
            /* Join as Partner Form */
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  {t("partner.joinTitle") || "Join as a Partner"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t("partner.joinDesc") ||
                    "Enter the temporary pairing code provided by your cycle partner. Data will be end-to-end decrypted on this device."}
                </p>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={partnerJoinCode}
                  onChange={(e) => setPartnerJoinCode(e.target.value.toUpperCase())}
                  placeholder="SAHELI-PAIR-XXXX-XXXX"
                  className="w-full max-w-sm rounded-xl border border-input bg-background/50 px-3.5 py-2.5 font-mono text-sm tracking-wider text-foreground uppercase focus:border-primary focus:outline-none"
                />

                <Btn
                  onClick={handleJoinPartner}
                  disabled={busy || !partnerJoinCode}
                  className="rounded-2xl px-5 py-2.5 text-xs font-bold"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  {busy ? t("common.loading") : t("partner.joinBtn") || "Connect to Partner"}
                </Btn>
              </div>

              {verificationCode && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 space-y-2 animate-in fade-in">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{t("partner.verifyTitle") || "Compare Verification Code:"}</span>
                  </div>
                  <div className="font-mono text-lg font-bold tracking-widest text-foreground">
                    {verificationCode}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {t("partner.verifyInstructions") ||
                      "Confirm this exact 6-digit number appears on the cycle owner's screen to verify connection authenticity."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Air-Gapped Snapshot Import (.sahelipartner) */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-3">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">
                Air-Gapped Snapshot Import (.sahelipartner)
              </h3>
              <p className="text-xs text-muted-foreground">
                Import an encrypted <code>.sahelipartner</code> snapshot file directly (e.g. via
                local file transfer, USB, or AirDrop) without network relays.
              </p>
            </div>

            <label className="flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 px-4 text-xs font-bold text-primary hover:bg-muted transition-all">
              <Upload className="h-4 w-4" />
              <span>{t("set.chooseFile") || "Choose .sahelipartner file"}</span>
              <input
                type="file"
                accept=".sahelipartner,.json"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setBusy(true);
                  setErrMsg("");
                  setStatusMsg("");
                  try {
                    const text = await file.text();
                    const decrypted = await importManualEncryptedSnapshot(text);
                    setPartnerSnapshot({ data: decrypted.data, timestamp: decrypted.timestamp });
                    setStatusMsg("Air-gapped snapshot imported and verified successfully.");
                    await refreshState();
                  } catch (err) {
                    setErrMsg(err.message || "Failed to import air-gapped snapshot.");
                  } finally {
                    setBusy(false);
                  }
                }}
                className="sr-only"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
