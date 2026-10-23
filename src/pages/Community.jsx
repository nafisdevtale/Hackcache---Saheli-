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
  const userAgeGroup = record?.settings?.ageGroup === "teen" ? "under18" : "adult";

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
        setError(data.error || "Failed to load community feed.");
      }
    } catch {
      setError("Network error connecting to community feed.");
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
    <div className="space-y-4">
      <PageTitle
        sub={
          t("comm.intro") || "A safe, pseudonymous peer-support space for women and girls in India."
        }
      >
        {t("comm.title") || "Saheli Community"}
      </PageTitle>

      {/* Identity Card */}
      <div className="rounded-2xl border border-primary/20 bg-primary-soft/10 p-3 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span>
            {t("comm.postingAs") || "Your alias:"}{" "}
            <strong className="text-foreground">{identity?.alias || "..."}</strong>
          </span>
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 font-semibold text-secondary-foreground uppercase text-[10px]">
          {userAgeGroup === "under18"
            ? t("comm.teenSpace") || "Teen Space"
            : t("comm.adultSpace") || "Adult Space"}
        </span>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("feed")}
          className={`flex min-h-11 items-center justify-center rounded-xl transition-all ${
            activeTab === "feed" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          {t("comm.tabFeed") || "Feed"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("new_post")}
          className={`flex min-h-11 items-center justify-center gap-1 rounded-xl transition-all ${
            activeTab === "new_post" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
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
              : "text-muted-foreground"
          }`}
        >
          {t("comm.tabMyActivity") || "My Posts"}
        </button>
      </div>

      {/* TAB 1: FEED */}
      {activeTab === "feed" && (
        <div className="space-y-4">
          {/* Topic Pills */}
          <div className="flex flex-wrap gap-1.5 pb-1">
            {TOPICS.map((top) => (
              <Chip
                key={top.id}
                onClick={() => setSelectedTopic(top.id)}
                className={
                  selectedTopic === top.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : ""
                }
              >
                {t(top.labelKey) || top.defaultLabel}
              </Chip>
            ))}
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t("comm.loading") || "Loading community posts..."}
            </p>
          ) : error ? (
            <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          ) : posts.length === 0 ? (
            <Card className="text-center py-8">
              <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-sm">
                {t("comm.empty") ||
                  "No posts in this topic yet. Be the first to start a conversation!"}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <Card key={post.id} className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-md bg-secondary/80 px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground capitalize">
                      {post.topic.replace("_", " ")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-foreground leading-snug">{post.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                    <span className="text-muted-foreground">
                      {post.author_alias} {post.is_own && "(You)"}
                    </span>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleOpenPost(post.id)}
                        className="flex items-center gap-1 font-semibold text-primary hover:underline"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>{post.reply_count || 0} Replies</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReportingTarget({ type: "post", id: post.id })}
                        className="text-muted-foreground hover:text-destructive text-[11px]"
                      >
                        Report
                      </button>
                    </div>
                  </div>

                  {/* Expanded Post Replies */}
                  {selectedPostId === post.id && (
                    <div className="mt-3 pt-3 border-t border-border space-y-3 bg-muted/30 p-3 rounded-xl">
                      <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                        Replies
                      </h4>

                      {selectedPostDetail?.replies?.length > 0 ? (
                        <div className="space-y-2">
                          {selectedPostDetail.replies.map((reply) => (
                            <div
                              key={reply.id}
                              className="rounded-lg bg-card p-2.5 text-xs space-y-1 border border-border/50"
                            >
                              <div className="flex justify-between text-muted-foreground text-[10px]">
                                <span className="font-semibold text-foreground">
                                  {reply.author_alias}
                                </span>
                                <span>{new Date(reply.created_at).toLocaleDateString()}</span>
                              </div>
                              <p className="text-foreground">{reply.content}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No approved replies yet.</p>
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
                          className="shrink-0 px-3"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Btn>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: NEW POST */}
      {activeTab === "new_post" && (
        <Card className="space-y-4">
          <div>
            <h2 className="font-bold text-base">
              {t("comm.newPostTitle") || "Create a Community Post"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("comm.newPostDesc") ||
                "Share experiences, ask questions, and give supportive advice. Phone numbers, emails, and links are automatically redacted."}
            </p>
          </div>

          {submitSuccess && (
            <div className="rounded-xl bg-primary-soft/40 p-3 text-sm text-primary flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{submitSuccess}</span>
            </div>
          )}

          <form onSubmit={handleCreatePost} className="space-y-3">
            <div>
              <label htmlFor="post-topic" className="block text-xs font-semibold mb-1">
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
              <label htmlFor="post-title" className="block text-xs font-semibold mb-1">
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
              <label htmlFor="post-content" className="block text-xs font-semibold mb-1">
                Details
              </label>
              <textarea
                id="post-content"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Share your experience or question respectfully. Do not share personal names or contact information."
                className={`${inputCls} min-h-32 py-2 resize-none`}
                maxLength={1000}
                required
              />
            </div>

            <div className="rounded-xl bg-muted/60 p-2.5 text-[11px] text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-primary" />
              <span>
                {t("comm.moderationNotice") ||
                  "Posts are screened by moderators to prevent bullying and spam before appearing publicly."}
              </span>
            </div>

            <Btn
              type="submit"
              className="w-full"
              disabled={submitting || !newTitle.trim() || !newContent.trim()}
            >
              {submitting ? "Submitting..." : t("comm.submitPost") || "Submit Post for Review"}
            </Btn>
          </form>
        </Card>
      )}

      {/* TAB 3: MY ACTIVITY */}
      {activeTab === "my_activity" && (
        <div className="space-y-4">
          <Card className="space-y-3">
            <h2 className="font-bold text-base">
              {t("comm.myPostsTitle") || "My Community Submissions"}
            </h2>
            <p className="text-xs text-muted-foreground">
              These are posts submitted from this phone. You can view their moderation status or
              wipe all your contributions at any time.
            </p>

            {myPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                You have not submitted any posts from this device yet.
              </p>
            ) : (
              <div className="space-y-2 pt-1">
                {myPosts.map((post) => (
                  <div key={post.id} className="rounded-xl border border-border p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{post.title}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
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
                    <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Delete All Community Data Button */}
          <Card className="border-2 border-destructive/20 space-y-2">
            <h3 className="font-bold text-sm text-destructive flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              {t("comm.wipeTitle") || "Delete All My Community Data"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("comm.wipeDesc") ||
                "Wipes all posts and replies published with your device identifier from the server immediately."}
            </p>

            {confirmDelete ? (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold text-destructive">
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
                    className="px-3 py-2 text-xs font-semibold rounded-xl bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="mt-2 text-xs font-semibold text-destructive hover:underline"
              >
                {t("comm.wipeBtn") || "Wipe my community posts..."}
              </button>
            )}
          </Card>
        </div>
      )}

      {/* Report Modal */}
      {reportingTarget && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm space-y-3">
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
                className="flex-1 bg-destructive text-destructive-foreground"
              >
                Submit Report
              </Btn>
              <button
                type="button"
                onClick={() => setReportingTarget(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-muted"
              >
                Cancel
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
