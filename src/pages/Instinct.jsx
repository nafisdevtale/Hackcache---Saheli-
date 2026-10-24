/**
 * Saheli 7.6 — INSTINCT AI Entertainment & Discovery Studio
 *
 * "Your Taste. Your Vibe. Your Next Favourite."
 *
 * Features:
 * - Section 10: Rich Media Detail modal with verified streaming, cast, ratings, trailers.
 * - Section 11: Dedicated Music Discovery & 30s audio previews.
 * - Section 12: Dedicated K-Drama Discovery with season & episode tracker.
 * - Section 13: My INSTINCT Library with Watchlist, Watching, Completed, Favourites, Music, JSON/CSV portability.
 * - Section 14: Recommendation Dashboard with personalized rows, explainable signals, novelty & hidden gems.
 * - Section 15: Real-time preference learning and taste profiles.
 * - Section 17: "Ask INSTINCT" Conversational Assistant with multi-turn chat and medical refusal safeguards.
 * - Section 18: Content Suitability & Age Safety filtering.
 * - Section 19: 100% On-Device Privacy isolation.
 */

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Film,
  Tv,
  Music,
  HeartHandshake,
  Sparkles,
  Search,
  Star,
  Play,
  Pause,
  Plus,
  Check,
  Heart,
  ThumbsUp,
  ThumbsDown,
  EyeOff,
  Clock,
  Compass,
  MessageCircle,
  Download,
  Upload,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  X,
  Volume2,
  Bookmark,
  Share2,
  RefreshCw,
  Info,
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { Btn, Card, cx } from "@/components/common/ui.jsx";
import { AiBadge } from "@/components/bloom/index.js";
import {
  VERIFIED_ENTERTAINMENT,
  MEDIA_TYPES,
  STREAMING_PLATFORMS,
} from "@/content/entertainment.js";
import {
  loadInstinctProfile,
  saveInstinctProfile,
  loadInstinctLibrary,
  saveInstinctLibrary,
  updateWatchProgress,
  toggleLibraryItem,
  setMediaRating,
  setMediaPreference,
  exportLibraryAsJson,
  exportLibraryAsCsv,
  importLibraryFromJson,
  importLibraryFromCsv,
  addRecentlyExplored,
} from "@/lib/instinctStorage.js";
import {
  getDashboardSections,
  getSimilarTitles,
  explainRecommendation,
  searchCatalogue,
} from "@/lib/instinctRecommender.js";

export default function Instinct() {
  const { t } = useApp();

  // State
  const [profile, setProfile] = useState(() => loadInstinctProfile());
  const [library, setLibrary] = useState(() => loadInstinctLibrary());
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "kdramas" | "music" | "library" | "ask"
  const [selectedType, setSelectedType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPortability, setShowPortability] = useState(false);
  const [showTrackerModal, setShowTrackerModal] = useState(null); // item for episode tracking
  const [toastMessage, setToastMessage] = useState(null);

  // Audio Preview State
  const [currentPlayingTrack, setCurrentPlayingTrack] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef(null);

  // Conversational Assistant State
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content:
        "Hey there! I am INSTINCT, your private culture & entertainment companion. Tell me what mood, genre, or vibe you're craving today!",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Persist Profile & Library changes
  const updateProfileState = (newProfile) => {
    setProfile(newProfile);
    saveInstinctProfile(newProfile);
  };

  const updateLibraryState = (newLibrary) => {
    setLibrary(newLibrary);
    saveInstinctLibrary(newLibrary);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Check Onboarding
  useEffect(() => {
    if (!profile.onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [profile.onboardingCompleted]);

  // Audio Player handling
  const togglePlayAudio = (track) => {
    if (currentPlayingTrack?.id === track.id && isPlayingAudio) {
      audioRef.current?.pause();
      setIsPlayingAudio(false);
    } else {
      setCurrentPlayingTrack(track);
      setIsPlayingAudio(true);
      if (audioRef.current) {
        audioRef.current.src = track.previewAudioUrl || "";
        audioRef.current.play().catch(() => setIsPlayingAudio(false));
      }
    }
  };

  // Dashboard Sections
  const dashboard = useMemo(() => {
    return getDashboardSections(profile, library, VERIFIED_ENTERTAINMENT);
  }, [profile, library]);

  // Filtered Items for active sub-views
  const filteredItems = useMemo(() => {
    return searchCatalogue(searchQuery, selectedType, VERIFIED_ENTERTAINMENT, profile, library);
  }, [searchQuery, selectedType, profile, library]);

  // Handle open media detail
  const handleOpenDetail = (item) => {
    setSelectedMedia(item);
    const updated = addRecentlyExplored(item.id, library);
    updateLibraryState(updated);
  };

  // Send Assistant Message
  const handleSendChatMessage = async (presetText) => {
    const textToSend = presetText || chatInput;
    if (!textToSend.trim() || isChatLoading) return;

    const newHistory = [...chatMessages, { role: "user", content: textToSend.trim() }];
    setChatMessages(newHistory);
    if (!presetText) setChatInput("");
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/instinct/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend.trim(),
          history: newHistory.slice(-6),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.text,
            recommendations: data.recommendations,
          },
        ]);
      } else {
        throw new Error();
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm here for you! I recommend checking out *Crash Landing on You* for comforting romance, *Laapataa Ladies* for brilliant satire, or *Kun Faya Kun* to unwind. What suits your mood best?",
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground pb-24">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlayingAudio(false)}
        onError={() => setIsPlayingAudio(false)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-card/80 backdrop-blur-xl px-4 py-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold tracking-tight">INSTINCT</h1>
                  <AiBadge agent="instinct" />
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  {t("instinct.tagline", "Your Taste. Your Vibe. Your Next Favourite.")}
                </p>
              </div>
            </div>

            {/* Quick Actions Mobile */}
            <div className="flex md:hidden items-center gap-1.5">
              <button
                onClick={() => setShowOnboarding(true)}
                className="p-2 rounded-xl bg-muted/60 text-muted-foreground hover:text-foreground"
                title="Edit Taste Profile"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowPortability(true)}
                className="p-2 rounded-xl bg-muted/60 text-muted-foreground hover:text-foreground"
                title="Data Portability"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Desktop Controls */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground font-medium">
              <span>Suitability:</span>
              <span className="font-bold text-foreground capitalize">
                {profile.ageFilter.replace("_", " ")}
              </span>
            </div>

            <Btn
              variant="outline"
              size="sm"
              onClick={() => setShowOnboarding(true)}
              className="gap-2 text-xs"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Taste Profile
            </Btn>

            <Btn
              variant="outline"
              size="sm"
              onClick={() => setShowPortability(true)}
              className="gap-2 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Export / Import
            </Btn>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: "dashboard", label: "Dashboard", icon: Compass },
            { id: "kdramas", label: "K-Dramas", icon: HeartHandshake },
            { id: "music", label: "Music", icon: Music },
            {
              id: "library",
              label: "My Library",
              icon: Bookmark,
              badge: library.watchlist.length + Object.keys(library.currentlyWatching).length,
            },
            { id: "ask", label: "Ask INSTINCT", icon: MessageCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cx(
                  "flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 select-none",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {tab.badge != null && tab.badge > 0 && (
                  <span
                    className={cx(
                      "px-1.5 py-0.2 rounded-full text-[10px] font-extrabold",
                      isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary",
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* ========================================================================= */}
        {/* TAB 1: RECOMMENDATION DASHBOARD                                           */}
        {/* ========================================================================= */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search titles, actors, directors, musical vibes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-muted/40 border border-border/60 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Media Type Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {MEDIA_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={cx(
                      "px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all",
                      selectedType === type.id
                        ? "bg-foreground text-background shadow-xs font-bold"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                    )}
                  >
                    {t(type.labelKey, type.id.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>

            {/* If searching, show direct search results */}
            {searchQuery ? (
              <div>
                <h2 className="text-base font-bold mb-4">
                  Search Results for "{searchQuery}" ({filteredItems.length})
                </h2>
                {filteredItems.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground text-xs">
                    No matching titles found in verified catalogue. Try searching another term or
                    asking INSTINCT!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredItems.map((item) => (
                      <MediaCard
                        key={item.id}
                        item={item}
                        profile={profile}
                        library={library}
                        onSelect={() => handleOpenDetail(item)}
                        onPlayAudio={togglePlayAudio}
                        isPlaying={currentPlayingTrack?.id === item.id && isPlayingAudio}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Personalized Dashboard Carousels */
              <div className="space-y-10">
                {/* 1. Continue Watching (If any) */}
                {dashboard.continueWatching.length > 0 && (
                  <DashboardRow
                    title="Continue Watching"
                    subtitle="Pick up right where you left off"
                    items={dashboard.continueWatching.map((cw) => cw.item)}
                    profile={profile}
                    library={library}
                    onSelect={handleOpenDetail}
                    onPlayAudio={togglePlayAudio}
                    isPlayingId={isPlayingAudio ? currentPlayingTrack?.id : null}
                  />
                )}

                {/* 2. Recommended for You */}
                <DashboardRow
                  title="Recommended For You"
                  subtitle="Trained ranking tailored to your taste profile"
                  items={dashboard.recommendedForYou}
                  profile={profile}
                  library={library}
                  onSelect={handleOpenDetail}
                  onPlayAudio={togglePlayAudio}
                  isPlayingId={isPlayingAudio ? currentPlayingTrack?.id : null}
                />

                {/* 3. Because You Liked */}
                {dashboard.becauseYouLiked.items.length > 0 && (
                  <DashboardRow
                    title={`Because You Enjoyed "${dashboard.becauseYouLiked.title}"`}
                    subtitle="Similar storytelling, themes, and tone"
                    items={dashboard.becauseYouLiked.items}
                    profile={profile}
                    library={library}
                    onSelect={handleOpenDetail}
                    onPlayAudio={togglePlayAudio}
                    isPlayingId={isPlayingAudio ? currentPlayingTrack?.id : null}
                  />
                )}

                {/* 4. Hidden Gems */}
                <DashboardRow
                  title="Hidden Gems"
                  subtitle="Exceptional audience acclaim, beyond the mainstream algorithm"
                  items={dashboard.hiddenGems}
                  profile={profile}
                  library={library}
                  onSelect={handleOpenDetail}
                  onPlayAudio={togglePlayAudio}
                  isPlayingId={isPlayingAudio ? currentPlayingTrack?.id : null}
                />

                {/* 5. Trending Now */}
                <DashboardRow
                  title="Trending Now"
                  subtitle="Current popular velocity across streaming networks"
                  items={dashboard.trendingNow}
                  profile={profile}
                  library={library}
                  onSelect={handleOpenDetail}
                  onPlayAudio={togglePlayAudio}
                  isPlayingId={isPlayingAudio ? currentPlayingTrack?.id : null}
                />

                {/* 6. Something Different */}
                <DashboardRow
                  title="Something Different"
                  subtitle="Controlled novelty to expand your cultural horizons"
                  items={dashboard.somethingDifferent}
                  profile={profile}
                  library={library}
                  onSelect={handleOpenDetail}
                  onPlayAudio={togglePlayAudio}
                  isPlayingId={isPlayingAudio ? currentPlayingTrack?.id : null}
                />

                {/* 7. Explore K-Dramas */}
                <DashboardRow
                  title="Explore K-Dramas"
                  subtitle="Top Korean storytelling, romance, and drama"
                  items={dashboard.exploreKdramas}
                  profile={profile}
                  library={library}
                  onSelect={handleOpenDetail}
                  onPlayAudio={togglePlayAudio}
                  isPlayingId={isPlayingAudio ? currentPlayingTrack?.id : null}
                />

                {/* 8. Music for You */}
                <DashboardRow
                  title="Music For Your Vibe"
                  subtitle="Relaxing sounds, regional folk, and uplifting melodies"
                  items={dashboard.musicForYou}
                  profile={profile}
                  library={library}
                  onSelect={handleOpenDetail}
                  onPlayAudio={togglePlayAudio}
                  isPlayingId={isPlayingAudio ? currentPlayingTrack?.id : null}
                />
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: DEDICATED K-DRAMAS                                                  */}
        {/* ========================================================================= */}
        {activeTab === "kdramas" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-500/20">
              <div>
                <h2 className="text-lg font-bold">K-Drama Universe</h2>
                <p className="text-xs text-muted-foreground">
                  Explore top-rated Korean series, track season and episode progress, and find
                  authentic Korean dramas.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Watching:</span>
                <span className="text-xs font-bold text-primary px-2.5 py-1 rounded-full bg-primary/10">
                  {Object.keys(library.currentlyWatching).length} Series
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {VERIFIED_ENTERTAINMENT.filter((i) => i.type === "kdrama").map((drama) => {
                const progress = library.currentlyWatching[drama.id];
                const isCompleted = library.completed.includes(drama.id);
                return (
                  <div key={drama.id} className="relative group">
                    <MediaCard
                      item={drama}
                      profile={profile}
                      library={library}
                      onSelect={() => handleOpenDetail(drama)}
                    />
                    {/* Quick Episode Tracker Action */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTrackerModal(drama);
                      }}
                      className="mt-2 w-full py-1.5 px-3 rounded-xl bg-muted/60 hover:bg-primary hover:text-primary-foreground text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Clock className="h-3 w-3" />
                      {isCompleted
                        ? "Completed"
                        : progress
                          ? `Ep ${progress.episode} / ${drama.episodes || 16}`
                          : "Track Progress"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: DEDICATED MUSIC                                                     */}
        {/* ========================================================================= */}
        {activeTab === "music" && (
          <div className="space-y-6">
            <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">Music Discovery & Soundscapes</h2>
                <p className="text-xs text-muted-foreground">
                  Explore relaxing sufi, regional Indian folk, K-pop, classical piano, and indie
                  melodies with 30s previews.
                </p>
              </div>
              {currentPlayingTrack && (
                <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-2xl border border-border/80 shadow-sm">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                    <Music className="h-4 w-4 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold leading-none">{currentPlayingTrack.title}</p>
                    <p className="text-[10px] text-muted-foreground leading-none mt-1">
                      {currentPlayingTrack.artist}
                    </p>
                  </div>
                  <button
                    onClick={() => togglePlayAudio(currentPlayingTrack)}
                    className="p-1.5 rounded-full bg-primary text-primary-foreground hover:scale-105 transition-all"
                  >
                    {isPlayingAudio ? (
                      <Pause className="h-3.5 w-3.5" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {VERIFIED_ENTERTAINMENT.filter((i) => i.type === "music").map((track) => (
                <div
                  key={track.id}
                  className="p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  <div className="flex gap-3">
                    <img
                      src={track.posterUrl}
                      alt={track.title}
                      className="h-16 w-16 rounded-xl object-cover shadow-2xs"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold truncate">{track.title}</h4>
                      <p className="text-[11px] text-muted-foreground truncate">{track.artist}</p>
                      <span className="inline-block mt-1 text-[9px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                        {track.genre}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
                    <button
                      onClick={() => togglePlayAudio(track)}
                      className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                    >
                      {currentPlayingTrack?.id === track.id && isPlayingAudio ? (
                        <>
                          <Pause className="h-3.5 w-3.5" /> Pause Preview
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" /> Play Preview
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        const updated = toggleLibraryItem("savedMusic", track.id, library);
                        updateLibraryState(updated);
                        showToast(
                          library.savedMusic.includes(track.id)
                            ? "Removed from My Music"
                            : "Saved to My Music",
                        );
                      }}
                      className={cx(
                        "p-1.5 rounded-xl transition-all",
                        library.savedMusic.includes(track.id)
                          ? "bg-rose-500/10 text-rose-500"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <Heart
                        className="h-4 w-4"
                        fill={library.savedMusic.includes(track.id) ? "currentColor" : "none"}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: MY INSTINCT LIBRARY                                                */}
        {/* ========================================================================= */}
        {activeTab === "library" && (
          <LibraryView
            library={library}
            profile={profile}
            onUpdateLibrary={updateLibraryState}
            onSelectMedia={handleOpenDetail}
            onOpenPortability={() => setShowPortability(true)}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 5: ASK INSTINCT (CONVERSATIONAL ASSISTANT)                             */}
        {/* ========================================================================= */}
        {activeTab === "ask" && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 text-xs flex items-start gap-3">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Ask INSTINCT Entertainment Companion</p>
                <p className="text-muted-foreground">
                  Ask for recommendations by mood, era, streaming platform, or specific tropes.
                  Instant on-device privacy guaranteed: INSTINCT has zero access to your cycle or
                  medical diary.
                </p>
              </div>
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {[
                "Comforting cozy series for a quiet evening",
                "Warm wholesome K-dramas with heartwarming friendships",
                "Acclaimed Indian satirical comedies on Netflix",
                "Meditative and peaceful music to unwind",
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendChatMessage(prompt)}
                  className="px-3 py-1.5 rounded-full bg-card border border-border/70 hover:border-primary text-xs font-medium text-muted-foreground hover:text-foreground shrink-0 transition-all shadow-2xs"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Chat History Container */}
            <div className="min-h-[350px] max-h-[500px] overflow-y-auto space-y-4 p-4 rounded-3xl bg-card border border-border/60">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cx(
                    "flex flex-col gap-2 max-w-[85%]",
                    msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start",
                  )}
                >
                  <div
                    className={cx(
                      "px-4 py-3 rounded-2xl text-xs leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground font-medium rounded-br-none"
                        : "bg-muted/70 text-foreground rounded-bl-none",
                    )}
                  >
                    {msg.content}
                  </div>

                  {/* Attached Recommendation Cards */}
                  {msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full mt-2">
                      {msg.recommendations.map((rec) => (
                        <div
                          key={rec.id}
                          onClick={() => handleOpenDetail(rec)}
                          className="p-2 rounded-xl bg-background border border-border/60 hover:border-primary cursor-pointer transition-all flex items-center gap-2"
                        >
                          <img
                            src={rec.posterUrl}
                            alt={rec.title}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold truncate">{rec.title}</p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {rec.releaseYear || rec.artist}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isChatLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                  <RefreshCw className="h-3 w-3 animate-spin" /> INSTINCT is thinking...
                </div>
              )}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChatMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask INSTINCT anything about movies, shows, music..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-4 py-3 rounded-2xl bg-card border border-border/80 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
              <Btn type="submit" size="sm" disabled={!chatInput.trim() || isChatLoading}>
                Ask
              </Btn>
            </form>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: MEDIA DETAIL VIEW                                                */}
      {/* ========================================================================= */}
      {selectedMedia && (
        <MediaDetailModal
          item={selectedMedia}
          profile={profile}
          library={library}
          onClose={() => setSelectedMedia(null)}
          onUpdateLibrary={updateLibraryState}
          onSelectSimilar={(sim) => setSelectedMedia(sim)}
          onPlayAudio={togglePlayAudio}
          isPlayingAudio={isPlayingAudio && currentPlayingTrack?.id === selectedMedia.id}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: K-DRAMA EPISODE TRACKER                                          */}
      {/* ========================================================================= */}
      {showTrackerModal && (
        <EpisodeTrackerModal
          drama={showTrackerModal}
          library={library}
          onClose={() => setShowTrackerModal(null)}
          onUpdateLibrary={updateLibraryState}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: COLD-START TASTE ONBOARDING & PROFILE SETTINGS                   */}
      {/* ========================================================================= */}
      {showOnboarding && (
        <TasteOnboardingModal
          profile={profile}
          onClose={() => setShowOnboarding(false)}
          onSave={(newProf) => {
            updateProfileState(newProf);
            setShowOnboarding(false);
            showToast("Taste Profile Updated!");
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DATA PORTABILITY (EXPORT / IMPORT)                               */}
      {/* ========================================================================= */}
      {showPortability && (
        <DataPortabilityModal
          library={library}
          onClose={() => setShowPortability(false)}
          onImport={(imported) => {
            updateLibraryState(imported);
            setShowPortability(false);
            showToast("Library successfully imported!");
          }}
        />
      )}
    </div>
  );
}

/**
 * Single Dashboard Carousel Row
 */
function DashboardRow({
  title,
  subtitle,
  items,
  profile,
  library,
  onSelect,
  onPlayAudio,
  isPlayingId,
}) {
  if (!items || items.length === 0) return null;

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-extrabold tracking-tight">{title}</h3>
        {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-stretch gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        {items.map((item) => (
          <div key={item.id} className="w-36 sm:w-44 shrink-0">
            <MediaCard
              item={item}
              profile={profile}
              library={library}
              onSelect={() => onSelect(item)}
              onPlayAudio={onPlayAudio}
              isPlaying={isPlayingId === item.id}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Card Component for Media Items
 */
function MediaCard({ item, profile, library, onSelect, onPlayAudio, isPlaying }) {
  const isMusic = item.type === "music";
  const isInWatchlist = library.watchlist?.includes(item.id);
  const isFavorite = library.favourites?.includes(item.id);

  return (
    <div
      onClick={onSelect}
      className="group relative cursor-pointer rounded-2xl bg-card border border-border/60 hover:border-primary/60 transition-all hover:shadow-md overflow-hidden flex flex-col h-full"
    >
      {/* Media Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
        <img
          src={item.posterUrl}
          alt={item.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Verified Rating Pill */}
        {item.rating && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-amber-400 shadow-sm">
            <Star className="h-2.5 w-2.5 fill-amber-400" />
            <span>{item.rating}</span>
          </div>
        )}

        {/* Type / Age Rating */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {item.ageRating && (
            <span className="px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[9px] font-extrabold text-white">
              {item.ageRating}
            </span>
          )}
        </div>

        {/* Music Quick Play Overlay */}
        {isMusic && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlayAudio(item);
            }}
            className="absolute bottom-2 right-2 p-2.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform"
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {/* Card Info */}
      <div className="p-2.5 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-bold leading-snug line-clamp-1 group-hover:text-primary transition-colors">
            {item.title}
          </h4>
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
            {item.releaseYear || item.artist}
            {item.genres?.[0] ? ` • ${item.genres[0]}` : item.genre ? ` • ${item.genre}` : ""}
          </p>
        </div>

        {/* Streaming Badges */}
        <div className="mt-2 flex items-center gap-1 overflow-hidden">
          {(item.streamingServices || []).slice(0, 2).map((srv) => (
            <span
              key={srv}
              className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-muted/70 text-muted-foreground uppercase"
            >
              {srv}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Media Detail Modal
 */
function MediaDetailModal({
  item,
  profile,
  library,
  onClose,
  onUpdateLibrary,
  onSelectSimilar,
  onPlayAudio,
  isPlayingAudio,
}) {
  const isMusic = item.type === "music";
  const isKdrama = item.type === "kdrama";
  const isInWatchlist = library.watchlist?.includes(item.id);
  const isFavourite = library.favourites?.includes(item.id);
  const isCompleted = library.completed?.includes(item.id);
  const currentRating = library.ratings?.[item.id] || 0;
  const isLiked = library.likes?.[item.id];
  const isDisliked = library.dislikes?.[item.id];
  const isNotInterested = library.notInterested?.includes(item.id);

  const explanations = explainRecommendation(item, profile, library);
  const similarItems = getSimilarTitles(item.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card rounded-3xl border border-border shadow-2xl p-6 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Grid */}
        <div className="flex flex-col sm:flex-row gap-5">
          <img
            src={item.posterUrl}
            alt={item.title}
            className="w-full sm:w-44 aspect-[2/3] object-cover rounded-2xl shadow-md shrink-0"
          />

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {item.type}
              </span>
              {item.ageRating && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-foreground">
                  {item.ageRating}
                </span>
              )}
              {item.rating && (
                <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                  <Star className="h-3 w-3 fill-amber-500" />
                  <span>{item.rating}/10</span>
                  {item.voteCount && (
                    <span className="text-[10px] text-muted-foreground font-normal">
                      ({item.voteCount.toLocaleString()} votes)
                    </span>
                  )}
                </div>
              )}
            </div>

            <h2 className="text-xl font-extrabold tracking-tight">{item.title}</h2>
            {item.originalTitle && item.originalTitle !== item.title && (
              <p className="text-xs text-muted-foreground italic">{item.originalTitle}</p>
            )}

            <div className="flex flex-wrap gap-1.5 pt-1">
              {(item.genres || [item.genre]).filter(Boolean).map((g) => (
                <span
                  key={g}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground"
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Meta Row */}
            <div className="text-[11px] text-muted-foreground space-y-0.5 pt-2">
              <p>
                <strong>Release:</strong> {item.releaseYear || item.releaseDate || "Verified"}
              </p>
              {item.runtime && (
                <p>
                  <strong>Runtime:</strong> {item.runtime}
                </p>
              )}
              {item.episodes && (
                <p>
                  <strong>Episodes:</strong> {item.episodes} episodes ({item.seasons || 1} seasons)
                </p>
              )}
              {item.cast && item.cast.length > 0 && (
                <p className="line-clamp-2">
                  <strong>Cast:</strong> {item.cast.join(", ")}
                </p>
              )}
              {item.creators && item.creators.length > 0 && (
                <p>
                  <strong>Creators:</strong> {item.creators.join(", ")}
                </p>
              )}
              {item.artist && (
                <p>
                  <strong>Artist:</strong> {item.artist}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Synopsis */}
        {item.synopsis && (
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Synopsis
            </h4>
            <p className="text-xs text-foreground/90 leading-relaxed">{item.synopsis}</p>
          </div>
        )}

        {/* Streaming Availability in India */}
        {item.streamingServices && item.streamingServices.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Where to Watch / Listen in India
            </h4>
            <div className="flex flex-wrap gap-2">
              {item.streamingServices.map((srvId) => {
                const srv = STREAMING_PLATFORMS.find((p) => p.id === srvId);
                return (
                  <span
                    key={srvId}
                    className={cx(
                      "px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5",
                      srv ? srv.color : "bg-muted text-muted-foreground",
                    )}
                  >
                    <ExternalLink className="h-3 w-3" />
                    {srv ? srv.name : srvId.toUpperCase()}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Trailer Link */}
        {item.trailerUrl && (
          <div>
            <a
              href={item.trailerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white transition-all text-xs font-bold"
            >
              <Play className="h-3.5 w-3.5" /> Watch Official Trailer
            </a>
          </div>
        )}

        {/* Grounded Recommendation Explanation */}
        <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-1.5">
          <h4 className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-primary" /> Why Recommended For You
          </h4>
          <ul className="text-xs space-y-1">
            {explanations.map((exp, i) => (
              <li key={i} className="text-muted-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{exp.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* User Interactive Actions */}
        <div className="space-y-3 pt-2 border-t border-border/40">
          <div className="flex flex-wrap items-center gap-2">
            {/* Watchlist Toggle */}
            <Btn
              variant={isInWatchlist ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                const updated = toggleLibraryItem("watchlist", item.id, library);
                onUpdateLibrary(updated);
              }}
              className="gap-1.5 text-xs"
            >
              {isInWatchlist ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
            </Btn>

            {/* Favourite Toggle */}
            <Btn
              variant={isFavourite ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                const updated = toggleLibraryItem("favourites", item.id, library);
                onUpdateLibrary(updated);
              }}
              className="gap-1.5 text-xs text-rose-500"
            >
              <Heart className="h-3.5 w-3.5" fill={isFavourite ? "currentColor" : "none"} />
              Favourite
            </Btn>

            {/* Completed Toggle */}
            <Btn
              variant={isCompleted ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                const updated = toggleLibraryItem("completed", item.id, library);
                onUpdateLibrary(updated);
              }}
              className="gap-1.5 text-xs"
            >
              <Check className="h-3.5 w-3.5" />
              {isCompleted ? "Completed" : "Mark Completed"}
            </Btn>

            {/* Feedback: Like / Dislike / Not Interested */}
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => {
                  const updated = setMediaPreference(item.id, "like", library);
                  onUpdateLibrary(updated);
                }}
                className={cx(
                  "p-2 rounded-xl transition-all",
                  isLiked ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted",
                )}
                title="Like"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => {
                  const updated = setMediaPreference(item.id, "dislike", library);
                  onUpdateLibrary(updated);
                }}
                className={cx(
                  "p-2 rounded-xl transition-all",
                  isDisliked
                    ? "bg-red-500/20 text-red-500"
                    : "text-muted-foreground hover:bg-muted",
                )}
                title="Dislike"
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => {
                  const updated = toggleLibraryItem("notInterested", item.id, library);
                  onUpdateLibrary(updated);
                  onClose();
                }}
                className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-red-500 transition-all"
                title="Not Interested"
              >
                <EyeOff className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* User Star Rating (1-10) */}
          <div className="flex items-center gap-2 pt-2">
            <span className="text-xs text-muted-foreground font-semibold">Your Rating:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <button
                  key={star}
                  onClick={() => {
                    const updated = setMediaRating(item.id, star, library);
                    onUpdateLibrary(updated);
                  }}
                  className={cx(
                    "p-0.5 hover:scale-125 transition-transform",
                    star <= currentRating ? "text-amber-400" : "text-muted-foreground/40",
                  )}
                >
                  <Star className="h-3 w-3 fill-currentColor" />
                </button>
              ))}
            </div>
            {currentRating > 0 && (
              <span className="text-xs font-bold text-amber-500 ms-1">{currentRating}/10</span>
            )}
          </div>
        </div>

        {/* Similar Titles Carousel */}
        {similarItems.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border/40">
            <h4 className="text-xs font-bold tracking-tight">More Like This</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {similarItems.map((sim) => (
                <div
                  key={sim.id}
                  onClick={() => onSelectSimilar(sim)}
                  className="cursor-pointer group rounded-xl p-2 bg-muted/40 hover:bg-muted transition-all"
                >
                  <img
                    src={sim.posterUrl}
                    alt={sim.title}
                    className="aspect-[2/3] w-full object-cover rounded-lg"
                  />
                  <p className="text-[11px] font-bold truncate mt-1.5 group-hover:text-primary">
                    {sim.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {sim.releaseYear || sim.artist}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Episode Progress Tracker Modal
 */
function EpisodeTrackerModal({ drama, library, onClose, onUpdateLibrary }) {
  const currentProgress = library.currentlyWatching[drama.id] || {
    season: 1,
    episode: 1,
  };
  const [season, setSeason] = useState(currentProgress.season || 1);
  const [episode, setEpisode] = useState(currentProgress.episode || 1);
  const [isCompleted, setIsCompleted] = useState(library.completed.includes(drama.id));

  const totalEpisodes = drama.episodes || 16;
  const totalSeasons = drama.seasons || 1;

  const handleSave = () => {
    let updated = updateWatchProgress(drama.id, season, episode, library);
    if (isCompleted && !library.completed.includes(drama.id)) {
      updated = toggleLibraryItem("completed", drama.id, updated);
    } else if (!isCompleted && library.completed.includes(drama.id)) {
      updated = toggleLibraryItem("completed", drama.id, updated);
    }
    onUpdateLibrary(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-card rounded-3xl border border-border p-6 space-y-5 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <img
            src={drama.posterUrl}
            alt={drama.title}
            className="h-16 w-12 object-cover rounded-xl shadow-2xs"
          />
          <div>
            <h3 className="text-sm font-bold">{drama.title}</h3>
            <p className="text-xs text-muted-foreground">Track Your Watching Progress</p>
          </div>
        </div>

        {/* Season & Episode Sliders */}
        <div className="space-y-4 pt-2">
          {totalSeasons > 1 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span>Season</span>
                <span className="text-primary font-bold">
                  {season} of {totalSeasons}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max={totalSeasons}
                value={season}
                onChange={(e) => setSeason(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          )}

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span>Episode</span>
              <span className="text-primary font-bold">
                {episode} of {totalEpisodes}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max={totalEpisodes}
              value={episode}
              onChange={(e) => setEpisode(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <label className="flex items-center gap-2 pt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isCompleted}
              onChange={(e) => setIsCompleted(e.target.checked)}
              className="rounded accent-primary"
            />
            <span className="text-xs font-semibold">Mark Entire Series as Completed</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
          <Btn variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Btn>
          <Btn size="sm" onClick={handleSave}>
            Save Progress
          </Btn>
        </div>
      </div>
    </div>
  );
}

/**
 * Library View Component
 */
function LibraryView({ library, profile, onUpdateLibrary, onSelectMedia, onOpenPortability }) {
  const [libraryTab, setLibraryTab] = useState("watchlist");

  const tabItems = useMemo(() => {
    switch (libraryTab) {
      case "watchlist":
        return VERIFIED_ENTERTAINMENT.filter((i) => library.watchlist.includes(i.id));
      case "watching":
        return VERIFIED_ENTERTAINMENT.filter((i) =>
          Object.keys(library.currentlyWatching).includes(i.id),
        );
      case "completed":
        return VERIFIED_ENTERTAINMENT.filter((i) => library.completed.includes(i.id));
      case "favourites":
        return VERIFIED_ENTERTAINMENT.filter((i) => library.favourites.includes(i.id));
      case "savedMusic":
        return VERIFIED_ENTERTAINMENT.filter((i) => library.savedMusic.includes(i.id));
      default:
        return [];
    }
  }, [libraryTab, library]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Subtabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: "watchlist", label: "Watchlist", count: library.watchlist.length },
            {
              id: "watching",
              label: "Watching",
              count: Object.keys(library.currentlyWatching).length,
            },
            { id: "completed", label: "Completed", count: library.completed.length },
            { id: "favourites", label: "Favourites", count: library.favourites.length },
            { id: "savedMusic", label: "My Music", count: library.savedMusic.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setLibraryTab(tab.id)}
              className={cx(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5",
                libraryTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted",
              )}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] opacity-75 font-normal">({tab.count})</span>
            </button>
          ))}
        </div>

        <Btn variant="outline" size="sm" onClick={onOpenPortability} className="gap-2 text-xs">
          <Download className="h-3.5 w-3.5" /> Export / Import Data
        </Btn>
      </div>

      {tabItems.length === 0 ? (
        <div className="text-center py-20 rounded-3xl border border-dashed border-border/80 p-8 space-y-2">
          <Bookmark className="h-8 w-8 text-muted-foreground/40 mx-auto" />
          <h4 className="text-sm font-bold">Your {libraryTab} is empty</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Discover movies, series, K-dramas, or music and save them to organize your entertainment
            journey.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tabItems.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              profile={profile}
              library={library}
              onSelect={() => onSelectMedia(item)}
              onPlayAudio={() => {}}
              isPlaying={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Taste Profile & Onboarding Modal
 */
function TasteOnboardingModal({ profile, onClose, onSave }) {
  const [ageFilter, setAgeFilter] = useState(profile.ageFilter || "all");
  const [preferredLanguages, setPreferredLanguages] = useState(
    profile.preferredLanguages || ["en", "hi"],
  );
  const [preferredServices, setPreferredServices] = useState(
    profile.preferredServices || ["netflix", "prime", "spotify"],
  );
  const [preferredGenres, setPreferredGenres] = useState(
    profile.preferredGenres || { movie: [], tv: [], kdrama: [], music: [] },
  );

  const toggleLang = (code) => {
    setPreferredLanguages((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const toggleService = (srv) => {
    setPreferredServices((prev) =>
      prev.includes(srv) ? prev.filter((s) => s !== srv) : [...prev, srv],
    );
  };

  const toggleGenre = (type, g) => {
    setPreferredGenres((prev) => {
      const current = prev[type] || [];
      const updated = current.includes(g) ? current.filter((x) => x !== g) : [...current, g];
      return { ...prev, [type]: updated };
    });
  };

  const handleFinish = () => {
    onSave({
      ...profile,
      onboardingCompleted: true,
      ageFilter,
      preferredLanguages,
      preferredServices,
      preferredGenres,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-card rounded-3xl border border-border p-6 space-y-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-1">
          <h2 className="text-lg font-bold">Personalize Your INSTINCT Taste</h2>
          <p className="text-xs text-muted-foreground">
            Tune your preferences for movies, series, K-dramas, and music. 100% on-device.
          </p>
        </div>

        {/* 1. Age & Content Suitability */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-muted-foreground">
            Content Suitability
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "all", label: "All Ages / General" },
              { id: "family_friendly", label: "Family Friendly Only" },
              { id: "teens_and_adults", label: "Teens & Adults" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAgeFilter(opt.id)}
                className={cx(
                  "p-2.5 rounded-2xl text-xs font-semibold border text-center transition-all",
                  ageFilter === opt.id
                    ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                    : "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Streaming Subscriptions */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-muted-foreground">
            Your Active Streaming Services
          </label>
          <div className="flex flex-wrap gap-2">
            {STREAMING_PLATFORMS.map((srv) => {
              const selected = preferredServices.includes(srv.id);
              return (
                <button
                  key={srv.id}
                  type="button"
                  onClick={() => toggleService(srv.id)}
                  className={cx(
                    "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5",
                    selected
                      ? "border-primary bg-primary text-primary-foreground shadow-2xs"
                      : "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted",
                  )}
                >
                  {selected && <Check className="h-3 w-3" />}
                  {srv.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Preferred Languages */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-muted-foreground">
            Languages You Enjoy
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { code: "hi", name: "Hindi" },
              { code: "en", name: "English" },
              { code: "ko", name: "Korean" },
              { code: "ta", name: "Tamil" },
              { code: "mr", name: "Marathi" },
              { code: "te", name: "Telugu" },
              { code: "bn", name: "Bengali" },
              { code: "ja", name: "Japanese" },
              { code: "ur", name: "Urdu" },
            ].map((lang) => {
              const selected = preferredLanguages.includes(lang.code);
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => toggleLang(lang.code)}
                  className={cx(
                    "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                    selected
                      ? "border-foreground bg-foreground text-background font-bold shadow-2xs"
                      : "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted",
                  )}
                >
                  {lang.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Genres */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-muted-foreground">
            Favorite Genres & Themes
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              "Romantic Comedy",
              "Slice of Life",
              "Mystery",
              "Thriller",
              "Legal Drama",
              "Animation",
              "Social Satire",
              "Biographical Drama",
              "Sufi Devotional",
              "K-Pop",
              "Indie Folk",
              "Classical Piano",
            ].map((genre) => {
              const isSelected = Object.values(preferredGenres).some((arr) => arr.includes(genre));
              return (
                <button
                  key={genre}
                  type="button"
                  onClick={() => {
                    toggleGenre("movie", genre);
                    toggleGenre("kdrama", genre);
                    toggleGenre("music", genre);
                  }}
                  className={cx(
                    "px-2.5 py-1 rounded-lg text-xs font-medium border transition-all",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary font-bold"
                      : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted",
                  )}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
          <Btn variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Btn>
          <Btn size="sm" onClick={handleFinish}>
            Save Preferences
          </Btn>
        </div>
      </div>
    </div>
  );
}

/**
 * Data Portability (Export & Import) Modal
 */
function DataPortabilityModal({ library, onClose, onImport }) {
  const [importText, setImportText] = useState("");
  const [importFormat, setImportFormat] = useState("json");
  const [errorMsg, setErrorMsg] = useState(null);

  const handleDownloadJson = () => {
    const jsonStr = exportLibraryAsJson(library);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `saheli-instinct-library-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    const csvStr = exportLibraryAsCsv(library);
    const blob = new Blob([csvStr], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `saheli-instinct-library-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyImport = () => {
    setErrorMsg(null);
    if (!importText.trim()) return;

    try {
      let imported;
      if (importFormat === "json") {
        imported = importLibraryFromJson(importText.trim(), library);
      } else {
        imported = importLibraryFromCsv(importText.trim(), library);
      }
      onImport(imported);
    } catch (e) {
      setErrorMsg("Failed to parse import data. Please check the file formatting.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-card rounded-3xl border border-border p-6 space-y-5 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div>
          <h2 className="text-lg font-bold">INSTINCT Data Portability</h2>
          <p className="text-xs text-muted-foreground">
            Export your watchlist, favorites, and music to keep, or restore them anytime.
          </p>
        </div>

        {/* Export Options */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
          <h4 className="text-xs font-bold uppercase text-muted-foreground">Export Your Library</h4>
          <div className="flex gap-2">
            <Btn size="sm" variant="outline" onClick={handleDownloadJson} className="gap-2 text-xs">
              <Download className="h-3.5 w-3.5" /> Download JSON
            </Btn>
            <Btn size="sm" variant="outline" onClick={handleDownloadCsv} className="gap-2 text-xs">
              <Download className="h-3.5 w-3.5" /> Download CSV
            </Btn>
          </div>
        </div>

        {/* Import Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase text-muted-foreground">
              Import Into Library
            </h4>
            <div className="flex gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => setImportFormat("json")}
                className={cx(
                  "px-2 py-0.5 rounded font-bold",
                  importFormat === "json"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground",
                )}
              >
                JSON
              </button>
              <button
                type="button"
                onClick={() => setImportFormat("csv")}
                className={cx(
                  "px-2 py-0.5 rounded font-bold",
                  importFormat === "csv"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground",
                )}
              >
                CSV
              </button>
            </div>
          </div>

          <textarea
            rows={4}
            placeholder={`Paste your ${importFormat.toUpperCase()} data here...`}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            className="w-full p-3 rounded-2xl bg-muted/30 border border-border/80 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
          />

          {errorMsg && <p className="text-xs text-destructive font-medium">{errorMsg}</p>}

          <Btn
            size="sm"
            onClick={handleApplyImport}
            disabled={!importText.trim()}
            className="w-full"
          >
            Apply Import
          </Btn>
        </div>
      </div>
    </div>
  );
}
