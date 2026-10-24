import { useState, useEffect } from "react";
import {
  Users,
  Shield,
  Plus,
  MessageCircle,
  AlertCircle,
  Trash2,
  Send,
  CheckCircle2,
  Clock,
  WifiOff,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { Btn, Card, PageTitle, inputCls, Chip } from "@/components/common/ui.jsx";
import {
  getCommunityIdentity,
  fetchCommunityPosts,
  fetchPostDetail,
  createCommunityPost,
  createCommunityReply,
  reportCommunityTarget,
  deleteAllCommunityData,
} from "@/lib/communityClient.js";

const TOPICS = [
  { id: "all", labelKey: "comm.topicAll", defaultLabel: "All Topics" },
  { id: "cycles", labelKey: "comm.topicCycles", defaultLabel: "Cycle Questions" },
  { id: "pcos", labelKey: "comm.topicPcos", defaultLabel: "PCOS / PCOD" },
  { id: "first_period", labelKey: "comm.topicFirstPeriod", defaultLabel: "First Period" },
  { id: "pain", labelKey: "comm.topicPain", defaultLabel: "Pain Relief" },
  { id: "hygiene", labelKey: "comm.topicHygiene", defaultLabel: "Hygiene & Products" },
  { id: "general", labelKey: "comm.topicGeneral", defaultLabel: "General Support" },
];

export default function Community() {
  const { t, record } = useApp();
  const userAgeGroup =
    record?.settings?.ageGroup === "under18" || record?.settings?.ageGroup === "teen"
      ? "under18"
      : "adult";

  const [identity, setIdentity] = useState(null);
  const [activeTab, setActiveTab] = useState("feed"); // 'feed' | 'my_activity' | 'new_post'
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Post Form
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTopic, setNewTopic] = useState("cycles");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // Expanded Post Details & Replies
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedPostDetail, setSelectedPostDetail] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  // Reporting
  const [reportingTarget, setReportingTarget] = useState(null); // { type, id }
  const [reportReason, setReportReason] = useState("Inappropriate content");

  // Deletion confirmation
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Load identity and posts
  useEffect(() => {
    let mounted = true;
    getCommunityIdentity().then((id) => {
      if (mounted) setIdentity(id);
    });
    loadPosts();
    return () => {
      mounted = false;
    };
  }, [userAgeGroup, selectedTopic]);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCommunityPosts(userAgeGroup, selectedTopic);
      if (data.ok) {
        setPosts(data.posts || []);
      } else {
        setError(data.error || "Community feed is offline or unavailable.");
      }
    } catch {
      setError("Unable to connect to community feed in offline mode.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPost = async (postId) => {
    if (selectedPostId === postId) {
      setSelectedPostId(null);
      setSelectedPostDetail(null);
      return;
    }
    setSelectedPostId(postId);
    setSelectedPostDetail(null);
    try {
      const data = await fetchPostDetail(postId, userAgeGroup);
      if (data.ok) {
        setSelectedPostDetail(data);
      }
    } catch {
      // ignore
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setSubmitting(true);
    setSubmitSuccess(null);
    setError(null);

    try {
      const res = await createCommunityPost({
        topic: newTopic,
        title: newTitle,
        content: newContent,
        ageGroup: userAgeGroup,
      });

      if (res.ok) {
        setSubmitSuccess(res.message || "Post submitted for moderation review.");
        setNewTitle("");
        setNewContent("");
        loadPosts();
        setTimeout(() => setActiveTab("my_activity"), 1500);
      } else {
        setError(res.error || "Failed to submit post.");
      }
    } catch {
      setError("Network error submitting post.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateReply = async (postId) => {
    if (!replyContent.trim()) return;
    setReplyLoading(true);
    try {
      const res = await createCommunityReply({
        postId,
        content: replyContent,
      });
      if (res.ok) {
        setReplyContent("");
        handleOpenPost(postId);
      }
    } catch {
      // ignore
    } finally {
      setReplyLoading(false);
    }
  };

  const handleReport = async () => {
    if (!reportingTarget) return;
    try {
      await reportCommunityTarget({
        targetType: reportingTarget.type,
        targetId: reportingTarget.id,
        reason: reportReason,
      });
      setReportingTarget(null);
      alert("Thank you. Our moderation team has received your report.");
      loadPosts();
    } catch {
      // ignore
    }
  };

  const handleDeleteAll = async () => {
    try {
      const res = await deleteAllCommunityData();
      if (res.ok) {
        alert(res.message);
        setConfirmDelete(false);
        loadPosts();
        setActiveTab("feed");
      }
    } catch {
      alert("Error deleting community posts.");
    }
  };

  const myPosts = posts.filter((p) => p.is_own);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-border/60 pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          {t("comm.title") || "Community"}
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {t("comm.title") || "Saheli Community"}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t("comm.intro") ||
            "A safe, pseudonymous peer-support space for women and girls across India."}
        </p>
      </div>

      {userAgeGroup === "under18" ? (
        /* TEEN SPACE COMPLIANCE NOTICE */
        <div className="bloom-card p-6 sm:p-8 space-y-4 max-w-2xl mx-auto border-2 border-primary/30">
          <div className="flex items-center gap-2 font-bold text-lg text-primary">
            <Shield className="h-6 w-6" />
            <span>Teen Peer Forum Protection (DPDP Act 2023)</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            In compliance with Section 9 of India's Digital Personal Data Protection Act (DPDP Act
            2023), the online community forum for under-18 users is paused until legal age-assurance
            and verifiable parental consent frameworks are certified.
          </p>
          <div className="rounded-2xl bg-card p-4 border border-border/70 text-xs text-foreground space-y-2">
            <p className="font-bold">Safe, verified resources available right now:</p>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
              <li>
                Verified adolescent health lessons (First Period, Cramps, Normal Cycle variation)
              </li>
              <li>Doctor appointment guidance and question lists</li>
              <li>Local-only cycle diary (never leaves your phone)</li>
            </ul>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="/learn"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary px-5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
            >
              Browse Health Lessons
            </a>
            <a
              href="/doctor"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-border bg-card px-5 text-xs font-bold hover:bg-muted text-foreground transition-all"
            >
              Doctor Guidance
            </a>
          </div>
        </div>
      ) : (
        /* ADULT SPACE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Identity, Safety Guidelines & Topic Filter */}
          <div className="lg:col-span-4 space-y-4">
            {/* Identity Card */}
            <div className="bloom-card p-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-muted-foreground">
                    {t("comm.postingAs") || "Your alias:"}
                  </span>
                </div>
                <span className="rounded-full bg-secondary/80 px-2.5 py-0.5 font-bold text-secondary-foreground uppercase text-[10px]">
                  {t("comm.adultSpace") || "Adult Space"}
                </span>
              </div>
              <p className="font-display text-xl font-bold text-foreground">
                {identity?.alias || "..."}
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Your device identity is pseudonymous. No email, phone number, or real identity is
                attached to your messages.
              </p>
            </div>

            {/* Topic Filter List */}
            <div className="bloom-card p-5 space-y-3">
              <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Discussion Topics
              </h2>
              <div className="flex flex-wrap lg:flex-col gap-1.5">
                {TOPICS.map((top) => {
                  const isSelected = selectedTopic === top.id;
                  return (
                    <button
                      key={top.id}
                      type="button"
                      onClick={() => setSelectedTopic(top.id)}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all text-left ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <span>{t(top.labelKey) || top.defaultLabel}</span>
                      {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Safe Community Rules */}
            <div className="rounded-3xl border border-border/70 bg-card/60 p-4 shadow-xs text-xs space-y-1.5">
              <p className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Community Rules
              </p>
              <ul className="text-[11px] text-muted-foreground space-y-1 list-disc pl-3.5 leading-relaxed">
                <li>Be respectful, supportive, and kind.</li>
                <li>Do not share prescription instructions or medical diagnoses.</li>
                <li>Never post phone numbers, WhatsApp links, or personal addresses.</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Tab Content (Feed / New Post / My Activity) */}
          <div className="lg:col-span-8 space-y-4">
            {/* View Tabs */}
            <div className="grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1 text-xs font-bold border border-border/40">
              <button
                type="button"
                onClick={() => setActiveTab("feed")}
                className={`flex min-h-11 items-center justify-center rounded-xl transition-all ${
                  activeTab === "feed"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("comm.tabFeed") || "Feed"}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("new_post")}
                className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl transition-all ${
                  activeTab === "new_post"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Plus className="h-4 w-4" />
                {t("comm.tabNewPost") || "New Post"}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("my_activity")}
                className={`flex min-h-11 items-center justify-center rounded-xl transition-all ${
                  activeTab === "my_activity"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("comm.tabMyActivity") || "My Posts"}
              </button>
            </div>

            {/* TAB 1: FEED */}
            {activeTab === "feed" && (
              <div className="space-y-4">
                {loading ? (
                  <div className="rounded-3xl border border-border/70 bg-card p-8 text-center shadow-soft">
                    <p className="text-sm text-muted-foreground">
                      {t("comm.loading") || "Loading community posts..."}
                    </p>
                  </div>
                ) : error ? (
                  <div className="rounded-3xl border border-border/70 bg-hero p-6 text-center shadow-soft space-y-3">
                    <WifiOff className="mx-auto h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        Offline or Local Peer Mode
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                        Saheli works local-first. When online, peer posts will sync automatically.
                        You can still view your submissions and draft questions anytime.
                      </p>
                    </div>
                    <Btn variant="outline" onClick={loadPosts} className="gap-2 text-xs">
                      <RefreshCw className="h-3.5 w-3.5" /> Try Reconnecting
                    </Btn>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="rounded-3xl border border-border/70 bg-card p-8 text-center shadow-soft space-y-3">
                    <Users className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm font-medium">
                      {t("comm.empty") ||
                        "No posts in this topic yet. Be the first to start a conversation!"}
                    </p>
                    <Btn onClick={() => setActiveTab("new_post")} className="text-xs">
                      Start Discussion
                    </Btn>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="rounded-lg bg-secondary/80 px-2.5 py-0.5 text-[11px] font-bold text-secondary-foreground capitalize">
                            {post.topic.replace("_", " ")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <h3 className="font-display font-bold text-base text-foreground leading-snug">
                          {post.title}
                        </h3>
                        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                          {post.content}
                        </p>

                        <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
                          <span className="text-muted-foreground font-medium">
                            {post.author_alias} {post.is_own && "(You)"}
                          </span>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleOpenPost(post.id)}
                              className="flex items-center gap-1.5 font-bold text-primary hover:underline"
                            >
                              <MessageCircle className="h-4 w-4" />
                              <span>{post.reply_count || 0} Replies</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setReportingTarget({ type: "post", id: post.id })}
                              className="text-muted-foreground hover:text-destructive text-xs"
                            >
                              Report
                            </button>
                          </div>
                        </div>

                        {/* Expanded Post Replies */}
                        {selectedPostId === post.id && (
                          <div className="mt-4 pt-4 border-t border-border space-y-3 bg-muted/40 p-4 rounded-2xl">
                            <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">
                              Replies
                            </h4>

                            {selectedPostDetail?.replies?.length > 0 ? (
                              <div className="space-y-2">
                                {selectedPostDetail.replies.map((reply) => (
                                  <div
                                    key={reply.id}
                                    className="rounded-xl bg-card p-3 text-xs space-y-1 border border-border/60 shadow-xs"
                                  >
                                    <div className="flex justify-between text-muted-foreground text-[10px]">
                                      <span className="font-bold text-foreground">
                                        {reply.author_alias}
                                      </span>
                                      <span>{new Date(reply.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-foreground leading-relaxed">
                                      {reply.content}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                No approved replies yet.
                              </p>
                            )}

                            {/* Add Reply */}
                            <div className="flex gap-2 pt-2">
                              <input
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Write a supportive reply..."
                                className={`${inputCls} text-xs py-2`}
                                maxLength={300}
                              />
                              <Btn
                                onClick={() => handleCreateReply(post.id)}
                                disabled={replyLoading || !replyContent.trim()}
                                className="shrink-0 px-4 min-h-11"
                              >
                                <Send className="h-4 w-4" />
                              </Btn>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: NEW POST */}
            {activeTab === "new_post" && (
              <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft space-y-4">
                <div>
                  <h2 className="font-display font-bold text-lg text-foreground">
                    {t("comm.newPostTitle") || "Create a Community Post"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("comm.newPostDesc") ||
                      "Share experiences, ask questions, and give supportive advice. Phone numbers, emails, and links are automatically redacted."}
                  </p>
                </div>

                {submitSuccess && (
                  <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4 text-xs font-semibold text-primary flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span>{submitSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleCreatePost} className="space-y-4">
                  <div>
                    <label
                      htmlFor="post-topic"
                      className="block text-xs font-bold mb-1 text-foreground"
                    >
                      Topic
                    </label>
                    <select
                      id="post-topic"
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      className={inputCls}
                    >
                      {TOPICS.filter((t) => t.id !== "all").map((top) => (
                        <option key={top.id} value={top.id}>
                          {t(top.labelKey) || top.defaultLabel}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="post-title"
                      className="block text-xs font-bold mb-1 text-foreground"
                    >
                      Title
                    </label>
                    <input
                      id="post-title"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Brief summary of your question or experience"
                      className={inputCls}
                      maxLength={100}
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="post-content"
                      className="block text-xs font-bold mb-1 text-foreground"
                    >
                      Details
                    </label>
                    <textarea
                      id="post-content"
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="Share your experience or question respectfully. Do not share personal names or contact information."
                      className={`${inputCls} min-h-36 py-3 resize-none`}
                      maxLength={1000}
                      required
                    />
                  </div>

                  <div className="rounded-2xl bg-muted/60 p-3 text-xs text-muted-foreground flex items-center gap-2 border border-border/50">
                    <Clock className="h-4 w-4 shrink-0 text-primary" />
                    <span>
                      {t("comm.moderationNotice") ||
                        "Posts are screened by moderators to prevent bullying and spam before appearing publicly."}
                    </span>
                  </div>

                  <Btn
                    type="submit"
                    className="w-full min-h-12"
                    disabled={submitting || !newTitle.trim() || !newContent.trim()}
                  >
                    {submitting
                      ? "Submitting..."
                      : t("comm.submitPost") || "Submit Post for Review"}
                  </Btn>
                </form>
              </div>
            )}

            {/* TAB 3: MY ACTIVITY */}
            {activeTab === "my_activity" && (
              <div className="space-y-4">
                <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft space-y-3">
                  <h2 className="font-display font-bold text-lg text-foreground">
                    {t("comm.myPostsTitle") || "My Community Submissions"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    These are posts submitted from this phone. You can view their moderation status
                    or wipe all your contributions at any time.
                  </p>

                  {myPosts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      You have not submitted any posts from this device yet.
                    </p>
                  ) : (
                    <div className="space-y-3 pt-2">
                      {myPosts.map((post) => (
                        <div
                          key={post.id}
                          className="rounded-2xl border border-border/70 p-4 space-y-1.5 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-foreground">{post.title}</span>
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                                post.status === "approved"
                                  ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                                  : post.status === "flagged"
                                    ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
                              }`}
                            >
                              {post.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {post.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Delete All Community Data */}
                <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-6 shadow-soft space-y-3">
                  <h3 className="font-bold text-sm text-destructive flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    {t("comm.wipeTitle") || "Delete All My Community Data"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t("comm.wipeDesc") ||
                      "Wipes all posts and replies published with your device identifier from the server immediately."}
                  </p>

                  {confirmDelete ? (
                    <div className="space-y-3 pt-2">
                      <p className="text-xs font-bold text-destructive">
                        Are you absolutely sure? This cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <Btn
                          onClick={handleDeleteAll}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs"
                        >
                          Yes, Permanently Delete
                        </Btn>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(false)}
                          className="px-4 py-2 text-xs font-bold rounded-xl bg-card border border-border"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="text-xs font-bold text-destructive hover:underline pt-1 inline-block"
                    >
                      {t("comm.wipeBtn") || "Wipe my community posts..."}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportingTarget && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-destructive font-bold">
              <AlertCircle className="h-5 w-5" />
              <span>Report Content</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Help keep Saheli safe. Please specify why this content should be reviewed:
            </p>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className={inputCls}
            >
              <option value="Inappropriate language">Inappropriate language</option>
              <option value="Medical misinformation">Medical misinformation</option>
              <option value="Contains personal contact info / PII">
                Contains personal contact info / PII
              </option>
              <option value="Bullying or harassment">Bullying or harassment</option>
              <option value="Spam or promotional">Spam or promotional</option>
            </select>
            <div className="flex gap-2 pt-2">
              <Btn
                onClick={handleReport}
                className="flex-1 bg-destructive text-destructive-foreground text-xs"
              >
                Submit Report
              </Btn>
              <button
                type="button"
                onClick={() => setReportingTarget(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
