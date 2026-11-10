"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Heart,
  Share2,
  Send,
  Info,
  Lock,
  Trash2,
  CornerDownRight,
  Loader2,
  ShieldCheck,
  Check,
  Image as ImageIcon,
  X,
  Edit2,
  Flag,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth-context";
import {
  getCommunityFeed,
  createPost,
  updatePost,
  deletePost,
  togglePostLike,
  getPostComments,
  addComment,
  deleteComment,
  toggleCommentLike,
  PostDto,
  CommentDto
} from "@/lib/api/community";
import { reportUser } from "@/lib/api/follow";

// Demo seed posts for visual testing & transparent preview
const DEMO_SEED_POSTS: PostDto[] = [
  {
    id: "demo-post-1",
    authorId: "seed-1",
    authorUsername: "contributor-01",
    authorFullName: "Mridul Islam",
    authorDesignation: "Team Lead & Systems Architect",
    isAuthorVerified: true,
    isOfficialAnnouncement: true,
    isPinned: true,
    isHidden: false,
    content:
      "[DEMO SEED CONTENT] Welcome to the MediNex Community feed! This is an interactive preview of our healthcare community feed. All community interactions adhere to strict data governance with zero PHI.",
    likesCount: 5,
    commentsCount: 2,
    media: [],
    isLiked: false,
    isOwner: false,
    visibility: "PUBLIC",
    createdAt: "2026-02-10T12:00:00Z",
    updatedAt: "2026-02-10T12:00:00Z",
  },
  {
    id: "demo-post-2",
    authorId: "seed-2",
    authorUsername: "contributor-04",
    authorFullName: "Jihad Khan",
    authorDesignation: "Telemedicine & Mobile Integration Lead",
    isAuthorVerified: true,
    isOfficialAnnouncement: false,
    isPinned: false,
    isHidden: false,
    content:
      "[DEMO SEED CONTENT] Researching low-latency audio transmission strategies over high-jitter 2G networks for the ShasthoSetu community triage bridge. We are exploring opus codecs with dynamic bitrate adjustment.",
    likesCount: 3,
    commentsCount: 1,
    media: [],
    isLiked: false,
    isOwner: false,
    visibility: "PUBLIC",
    createdAt: "2026-02-09T16:30:00Z",
    updatedAt: "2026-02-09T16:30:00Z",
  },
];

export default function CommunityFeedPage() {
  const { user, isAuthenticated } = useAuth();

  const [posts, setPosts] = useState<PostDto[]>([]);
  const [showDemoPosts, setShowDemoPosts] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<"ALL" | "OFFICIAL">("ALL");
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  // New post form state
  const [newContent, setNewContent] = useState("");
  const [newVisibility, setNewVisibility] = useState<"PUBLIC" | "MEMBERS_ONLY">("PUBLIC");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [showImageInput, setShowImageInput] = useState(false);
  const [isAnnouncement, setIsAnnouncement] = useState(false);

  // Comments state: map postId -> { comments: CommentDto[], open: boolean, loading: boolean }
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, CommentDto[]>>({});
  const [commentTextMap, setCommentTextMap] = useState<Record<string, string>>({});
  const [replyToMap, setReplyToMap] = useState<Record<string, string | null>>({});
  const [commentLoadingMap, setCommentLoadingMap] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit post state
  const [editingPost, setEditingPost] = useState<PostDto | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const [editVisibility, setEditVisibility] = useState<"PUBLIC" | "MEMBERS_ONLY" | "PRIVATE">("PUBLIC");
  const [isUpdatingPost, setIsUpdatingPost] = useState<boolean>(false);

  // Report post state
  const [reportingPost, setReportingPost] = useState<PostDto | null>(null);
  const [reportReason, setReportReason] = useState<string>("INAPPROPRIATE_CONTENT");
  const [reportDetails, setReportDetails] = useState<string>("");
  const [reportSubmitted, setReportSubmitted] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const page = await getCommunityFeed(0, 25);
      setPosts(page.content);
    } catch (err) {
      console.error("Failed to fetch community feed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || publishing) return;

    setPublishing(true);
    setCreateError(null);
    try {
      const created = await createPost({
        content: newContent.trim(),
        visibility: newVisibility,
        mediaUrls: mediaUrls.filter((u) => u.trim().length > 0),
        isOfficialAnnouncement: isAnnouncement,
      });

      setPosts((prev) => [created, ...prev]);
      setNewContent("");
      setMediaUrls([]);
      setShowImageInput(false);
      setImageUrlInput("");
      setIsAnnouncement(false);
    } catch (err: unknown) {
      console.error("Failed to publish post:", err);
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      setCreateError(apiErr?.response?.data?.message || apiErr?.message || "Failed to publish post. Please check community rules.");
    } finally {
      setPublishing(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!isAuthenticated) return;

    try {
      const res = await togglePostLike(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, isLiked: res.isLiked, likesCount: res.likesCount } : p
        )
      );
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  const handleToggleComments = async (postId: string) => {
    const isCurrentlyOpen = !!expandedComments[postId];
    setExpandedComments((prev) => ({ ...prev, [postId]: !isCurrentlyOpen }));

    if (!isCurrentlyOpen && !commentsMap[postId]) {
      setCommentLoadingMap((prev) => ({ ...prev, [postId]: true }));
      try {
        const page = await getPostComments(postId, 0, 50);
        setCommentsMap((prev) => ({ ...prev, [postId]: page.content }));
      } catch (err) {
        console.error("Failed to load comments:", err);
      } finally {
        setCommentLoadingMap((prev) => ({ ...prev, [postId]: false }));
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentTextMap[postId];
    if (!text || !text.trim()) return;

    const parentId = replyToMap[postId] || undefined;
    try {
      const newComment = await addComment(postId, {
        content: text.trim(),
        parentCommentId: parentId,
      });

      setCommentsMap((prev) => {
        const currentList = prev[postId] || [];
        if (parentId) {
          return {
            ...prev,
            [postId]: currentList.map((c) =>
              c.id === parentId
                ? { ...c, replies: [...(c.replies || []), newComment], repliesCount: c.repliesCount + 1 }
                : c
            ),
          };
        } else {
          return { ...prev, [postId]: [...currentList, newComment] };
        }
      });

      // Update post comment count
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
      );

      setCommentTextMap((prev) => ({ ...prev, [postId]: "" }));
      setReplyToMap((prev) => ({ ...prev, [postId]: null }));
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!window.confirm("Delete this comment?")) return;

    try {
      await deleteComment(commentId);
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((c) => c.id !== commentId),
      }));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } : p
        )
      );
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  const handleToggleCommentLike = async (commentId: string, postId: string) => {
    if (!isAuthenticated) return;
    try {
      const res = await toggleCommentLike(commentId);
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).map((c) =>
          c.id === commentId ? { ...c, isLiked: res.isLiked, likesCount: res.likesCount } : c
        ),
      }));
    } catch (err) {
      console.error("Failed to toggle comment like:", err);
    }
  };

  const handleAddMediaUrl = () => {
    if (imageUrlInput.trim() && mediaUrls.length < 4) {
      setMediaUrls([...mediaUrls, imageUrlInput.trim()]);
      setImageUrlInput("");
    }
  };

  const handleOpenEdit = (post: PostDto) => {
    setEditingPost(post);
    setEditContent(post.content);
    setEditVisibility(post.visibility);
  };

  const handleSaveEdit = async () => {
    if (!editingPost || !editContent.trim() || isUpdatingPost) return;
    setIsUpdatingPost(true);
    try {
      const updated = await updatePost(editingPost.id, {
        content: editContent.trim(),
        visibility: editVisibility,
      });
      setPosts((prev) => prev.map((p) => (p.id === editingPost.id ? updated : p)));
      setEditingPost(null);
    } catch (err) {
      console.error("Failed to update post:", err);
    } finally {
      setIsUpdatingPost(false);
    }
  };

  const handleOpenReport = (post: PostDto) => {
    setReportingPost(post);
    setReportReason("INAPPROPRIATE_CONTENT");
    setReportDetails("");
    setReportSubmitted(false);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingPost) return;
    try {
      await reportUser(
        reportingPost.authorUsername,
        reportReason,
        reportDetails,
        reportingPost.id,
        undefined
      );
      setReportSubmitted(true);
      setTimeout(() => {
        setReportingPost(null);
        setReportSubmitted(false);
        setReportDetails("");
      }, 2000);
    } catch (err) {
      console.error("Failed to submit report:", err);
    }
  };

  const handleCopyLink = (postId: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/community/posts/${postId}`);
      setCopiedId(postId);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // Combine database posts with demo posts if toggled
  const allPosts = [
    ...posts,
    ...(showDemoPosts ? DEMO_SEED_POSTS : []),
  ];

  const displayedPosts = allPosts.filter((p) => {
    if (filterType === "OFFICIAL") return p.isOfficialAnnouncement;
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#F7FAF9] pb-24">
      {/* Dark Hero Header */}
      <section className="bg-[#071A18] text-white py-14 border-b border-[#063D38]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <Badge variant="mint">Public Community Feed</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            MediNex Community Discourse
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            Collaborate on open-source health tech, review ShasthoSetu specifications, and track official
            E-Health Hackathon 2026 development milestones.
          </p>
        </div>
      </section>

      {/* Demo Content Toggle Banner */}
      <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-3">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Transparency Disclosure:</strong> Live database posts and verified seed updates are clearly distinguished.
            </span>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-amber-800">
              <input
                type="checkbox"
                checked={showDemoPosts}
                onChange={(e) => setShowDemoPosts(e.target.checked)}
                className="rounded border-amber-400 text-[#0D9488] focus:ring-[#0D9488]"
              />
              <span>Show Seed / Demo Content</span>
            </label>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-8 space-y-6 w-full">
        {/* Post Creation Box */}
        {isAuthenticated && user ? (
          <Card className="shadow-sm border-slate-200/80">
            <CardBody className="p-4 sm:p-5">
              <form onSubmit={handleCreatePost} className="space-y-3">
                {createError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1 leading-relaxed">
                      <strong>Submission Blocked:</strong> {createError}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCreateError(null)}
                      className="text-rose-500 hover:text-rose-700 p-0.5"
                      aria-label="Dismiss error"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#063D38] to-[#0D9488] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <textarea
                      rows={3}
                      placeholder="Share an architectural insight, technical question, or feedback on ShasthoSetu (Zero PHI allowed)..."
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      className="w-full text-xs sm:text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D9488] resize-none"
                    />

                    {/* Media Attachments Preview */}
                    {mediaUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {mediaUrls.map((url, idx) => (
                          <div
                            key={idx}
                            className="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="Attachment preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setMediaUrls(mediaUrls.filter((_, i) => i !== idx))}
                              className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Image Attachment Input Box */}
                    {showImageInput && (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="url"
                          placeholder="Paste image URL (https://...)"
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          className="flex-1 text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                        />
                        <button
                          type="button"
                          onClick={handleAddMediaUrl}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowImageInput(!showImageInput)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-[#0D9488]" />
                      <span>Attach Image ({mediaUrls.length}/4)</span>
                    </button>

                    <select
                      value={newVisibility}
                      onChange={(e) => setNewVisibility(e.target.value as "PUBLIC" | "MEMBERS_ONLY")}
                      className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:outline-none"
                    >
                      <option value="PUBLIC">Public</option>
                      <option value="MEMBERS_ONLY">Members Only</option>
                    </select>

                    {(user.isTeamMember || user.roles.some((r) => r.includes("ADMIN"))) && (
                      <label className="flex items-center gap-1 text-xs text-[#0D9488] font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isAnnouncement}
                          onChange={(e) => setIsAnnouncement(e.target.checked)}
                          className="rounded text-[#0D9488] focus:ring-[#0D9488]"
                        />
                        <span>Official Update</span>
                      </label>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200/80">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488]" />
                      <span>Strict Zero-PHI Active</span>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={!newContent.trim() || publishing}
                    >
                      {publishing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Send className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      <span>Publish Post</span>
                    </Button>
                  </div>
                </div>
              </form>
            </CardBody>
          </Card>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                <Lock className="w-5 h-5 text-[#0D9488]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Join the Healthcare Innovation Conversation</h3>
                <p className="text-xs text-slate-500">Sign in to publish posts, share clinical feedback, and like updates.</p>
              </div>
            </div>
            <Link href="/login" className="shrink-0">
              <Button variant="primary" size="sm">
                Sign In to Post
              </Button>
            </Link>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === "ALL"
                  ? "bg-[#0D9488] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              All Discussions
            </button>
            <button
              onClick={() => setFilterType("OFFICIAL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === "OFFICIAL"
                  ? "bg-[#0D9488] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Official Updates Only
            </button>
          </div>

          <span className="text-xs text-slate-400">
            {displayedPosts.length} {displayedPosts.length === 1 ? "Post" : "Posts"}
          </span>
        </div>

        {/* Feed Posts List */}
        {loading && posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" />
            <p className="text-xs text-slate-500">Loading community discourse...</p>
          </div>
        ) : displayedPosts.length === 0 ? (
          <Card className="text-center py-16 px-4">
            <CardBody className="space-y-4 max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-[#0D9488] flex items-center justify-center mx-auto">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No Community Posts Yet</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Be the first health innovator or researcher to publish an insight! Or toggle &quot;Show Seed / Demo Content&quot; above to preview sample posts.
              </p>
            </CardBody>
          </Card>
        ) : (
          displayedPosts.map((post) => (
            <Card key={post.id} className="shadow-sm border-slate-200/80 overflow-hidden">
              <CardBody className="p-5 space-y-4">
                {/* Author row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-sm text-[#063D38] shrink-0">
                      {post.authorAvatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.authorAvatarUrl}
                          alt={post.authorFullName}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        post.authorFullName?.charAt(0) || post.authorUsername.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/team/${post.authorUsername}`}
                          className="font-bold text-sm text-slate-900 hover:text-[#0D9488] transition-colors"
                        >
                          {post.authorFullName || post.authorUsername}
                        </Link>
                        {post.isAuthorVerified && (
                          <span title="Verified Contributor">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488]" />
                          </span>
                        )}
                        {post.isOfficialAnnouncement && (
                          <Badge variant="teal" size="sm">
                            Official Announcement
                          </Badge>
                        )}
                        {post.id.startsWith("demo-") && (
                          <Badge variant="placeholder" size="sm">
                            Demo Seed
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        @{post.authorUsername} &bull; {new Date(post.createdAt).toLocaleDateString()}
                        {post.authorDesignation && (
                          <span className="hidden sm:inline"> &bull; {post.authorDesignation}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Post Options (Owner/Admin Edit & Delete, User Report) */}
                  <div className="flex items-center gap-1">
                    {(post.isOwner || (user && user.roles.some((r) => r.includes("ADMIN")))) && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(post)}
                          className="text-slate-400 hover:text-[#0D9488] transition-colors p-1"
                          title="Edit post"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          title="Delete post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {isAuthenticated && !post.isOwner && !post.id.startsWith("demo-") && (
                      <button
                        onClick={() => handleOpenReport(post)}
                        className="text-slate-400 hover:text-amber-600 transition-colors p-1"
                        title="Report post"
                      >
                        <Flag className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>

                {/* Media grid if attachments exist */}
                {post.media && post.media.length > 0 && (
                  <div className={`grid gap-2 pt-1 ${post.media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                    {post.media.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-72"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.mediaUrl} alt="Post attachment" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Interaction Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      disabled={!isAuthenticated}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                        post.isLiked
                          ? "text-rose-600 bg-rose-50 font-semibold"
                          : "text-slate-600 hover:bg-slate-100"
                      } ${!isAuthenticated ? "opacity-75 cursor-not-allowed" : ""}`}
                      title={!isAuthenticated ? "Sign in to like" : ""}
                    >
                      <Heart className={`w-4 h-4 ${post.isLiked ? "fill-current" : ""}`} />
                      <span>{post.likesCount} {post.likesCount === 1 ? "Like" : "Likes"}</span>
                    </button>

                    <button
                      onClick={() => handleToggleComments(post.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 text-[#0D9488]" />
                      <span>{post.commentsCount} Comments</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/community/posts/${post.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-[#0D9488] hover:bg-slate-100 transition-colors"
                      title="Open full discussion thread"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Thread</span>
                    </Link>

                    <button
                      onClick={() => handleCopyLink(post.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      {copiedId === post.id ? (
                        <>
                          <Check className="w-4 h-4 text-[#0D9488]" />
                          <span className="text-[#0D9488] font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4" />
                          <span>Share</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Comments Section */}
                {expandedComments[post.id] && (
                  <div className="pt-3 border-t border-slate-100 space-y-4">
                    {/* Add Comment Input */}
                    {isAuthenticated ? (
                      <div className="space-y-2">
                        {replyToMap[post.id] && (
                          <div className="flex items-center justify-between px-3 py-1 rounded bg-teal-50 text-xs text-[#0D9488]">
                            <span>Replying to comment</span>
                            <button
                              onClick={() => setReplyToMap((prev) => ({ ...prev, [post.id]: null }))}
                              className="font-bold hover:underline"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Write a constructive comment..."
                            value={commentTextMap[post.id] || ""}
                            onChange={(e) =>
                              setCommentTextMap((prev) => ({ ...prev, [post.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment(post.id);
                              }
                            }}
                            className="flex-1 text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddComment(post.id)}
                            className="p-2.5 rounded-xl bg-[#0D9488] hover:bg-[#063D38] text-white transition-colors"
                            title="Submit Comment"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                        <Link href="/login" className="text-[#0D9488] font-semibold hover:underline">
                          Sign in
                        </Link>{" "}
                        to participate in this discussion thread.
                      </div>
                    )}

                    {/* Comments List */}
                    {commentLoadingMap[post.id] ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-[#0D9488]" />
                      </div>
                    ) : (commentsMap[post.id] || []).length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-2">
                        No comments yet. Start the conversation!
                      </p>
                    ) : (
                      <div className="space-y-3 divide-y divide-slate-100">
                        {(commentsMap[post.id] || []).map((c) => (
                          <div key={c.id} className="pt-2.5 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-[#063D38] shrink-0 mt-0.5">
                                  {c.authorFullName?.charAt(0) || c.authorUsername.charAt(0)}
                                </div>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-slate-900">
                                      {c.authorFullName || c.authorUsername}
                                    </span>
                                    {c.isAuthorVerified && (
                                      <span title="Verified Contributor">
                                        <ShieldCheck className="w-3 h-3 text-[#0D9488]" />
                                      </span>
                                    )}
                                    <span className="text-[10px] text-slate-400">
                                      {new Date(c.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-700 leading-relaxed">{c.content}</p>
                                </div>
                              </div>

                              {(c.isOwner || (user && user.roles.some((r) => r.includes("ADMIN")))) && (
                                <button
                                  onClick={() => handleDeleteComment(post.id, c.id)}
                                  className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                                  title="Delete comment"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {/* Comment Action Sub-row */}
                            <div className="flex items-center gap-4 pl-9 text-[11px] text-slate-500">
                              <button
                                onClick={() => handleToggleCommentLike(c.id, post.id)}
                                disabled={!isAuthenticated}
                                className={`inline-flex items-center gap-1 ${
                                  c.isLiked ? "text-rose-600 font-semibold" : "hover:text-slate-800"
                                }`}
                              >
                                <Heart className={`w-3 h-3 ${c.isLiked ? "fill-current" : ""}`} />
                                <span>{c.likesCount}</span>
                              </button>

                              {isAuthenticated && (
                                <button
                                  onClick={() => setReplyToMap((prev) => ({ ...prev, [post.id]: c.id }))}
                                  className="hover:text-[#0D9488] font-medium"
                                >
                                  Reply
                                </button>
                              )}
                            </div>

                            {/* Nested Replies */}
                            {c.replies && c.replies.length > 0 && (
                              <div className="pl-9 space-y-2 pt-1.5 border-l-2 border-slate-100 ml-4">
                                {c.replies.map((reply) => (
                                  <div key={reply.id} className="flex items-start gap-2">
                                    <CornerDownRight className="w-3 h-3 text-slate-300 mt-1 shrink-0" />
                                    <div className="flex-1 space-y-0.5">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-[11px] text-slate-900">
                                          {reply.authorFullName || reply.authorUsername}
                                        </span>
                                        <span className="text-[9px] text-slate-400">
                                          {new Date(reply.createdAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-600">{reply.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          ))
        )}
      </div>

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Edit Community Post</h3>
              <button
                onClick={() => setEditingPost(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <textarea
                rows={4}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                placeholder="Update post content..."
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Visibility:</span>
                  <select
                    value={editVisibility}
                    onChange={(e) => setEditVisibility(e.target.value as "PUBLIC" | "MEMBERS_ONLY" | "PRIVATE")}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="MEMBERS_ONLY">Members Only</option>
                    <option value="PRIVATE">Private</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingPost(null)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={isUpdatingPost || !editContent.trim()}
                    className="text-xs"
                  >
                    {isUpdatingPost ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Post Modal */}
      {reportingPost && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Report Community Post</h3>
              <button
                onClick={() => setReportingPost(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSubmitted ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Thank you. Your report has been submitted to moderators.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reason for Report
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                  >
                    <option value="INAPPROPRIATE_CONTENT">Inappropriate Content</option>
                    <option value="SPAM">Spam or Self-Promotion</option>
                    <option value="HARASSMENT">Harassment or Hate Speech</option>
                    <option value="FALSE_INFORMATION">False or Misleading Healthcare Information</option>
                    <option value="OTHER">Other Community Guideline Breach</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Details (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide additional context for moderators (e.g., guideline breached)..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setReportingPost(null)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="text-xs">
                    Submit Report
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
