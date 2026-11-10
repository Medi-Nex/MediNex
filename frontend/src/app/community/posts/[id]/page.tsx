"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Share2,
  ShieldCheck,
  Check,
  Trash2,
  Edit2,
  Flag,
  Send,
  CornerDownRight,
  AlertTriangle,
  Lock,
  X,
  Clock,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import {
  getPostById,
  getPostComments,
  addComment,
  deleteComment,
  togglePostLike,
  toggleCommentLike,
  deletePost,
  updatePost,
  PostDto,
  CommentDto,
} from "@/lib/api/community";
import { reportUser } from "@/lib/api/follow";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default function SinglePostPage({ params }: PostPageProps) {
  const resolvedParams = use(params);
  const postId = resolvedParams.id;
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [post, setPost] = useState<PostDto | null>(null);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Comment input state
  const [newCommentText, setNewCommentText] = useState<string>("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Link copied state
  const [copied, setCopied] = useState<boolean>(false);

  // Edit post state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editContent, setEditContent] = useState<string>("");
  const [editVisibility, setEditVisibility] = useState<"PUBLIC" | "MEMBERS_ONLY" | "PRIVATE">("PUBLIC");
  const [isUpdatingPost, setIsUpdatingPost] = useState<boolean>(false);

  // Report modal state
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<string>("INAPPROPRIATE_CONTENT");
  const [reportDetails, setReportDetails] = useState<string>("");
  const [reportSubmitted, setReportSubmitted] = useState<boolean>(false);

  useEffect(() => {
    async function loadPostData() {
      setLoading(true);
      setError(null);
      try {
        const [postData, commentsData] = await Promise.all([
          getPostById(postId),
          getPostComments(postId, 0, 50),
        ]);
        setPost(postData);
        setComments(commentsData.content || []);
        setEditContent(postData.content);
        setEditVisibility(postData.visibility);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load post";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    loadPostData();
  }, [postId]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      router.push("/login?redirect=" + encodeURIComponent(`/community/posts/${postId}`));
      return;
    }
    if (!post) return;

    try {
      const res = await togglePostLike(postId);
      setPost({
        ...post,
        isLiked: res.isLiked,
        likesCount: res.likesCount,
      });
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this post?")) return;
    try {
      await deletePost(postId);
      router.push("/community");
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  const handleSaveEdit = async () => {
    if (!post || !editContent.trim()) return;
    setIsUpdatingPost(true);
    try {
      const updated = await updatePost(postId, {
        content: editContent.trim(),
        visibility: editVisibility,
      });
      setPost(updated);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update post:", err);
    } finally {
      setIsUpdatingPost(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || isSubmittingComment) return;

    if (!isAuthenticated) {
      router.push("/login?redirect=" + encodeURIComponent(`/community/posts/${postId}`));
      return;
    }

    setIsSubmittingComment(true);
    setCommentError(null);
    try {
      const newComment = await addComment(postId, {
        content: newCommentText.trim(),
        parentCommentId: replyToId || undefined,
      });

      if (replyToId) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyToId
              ? {
                  ...c,
                  replies: [...(c.replies || []), newComment],
                  repliesCount: (c.repliesCount || 0) + 1,
                }
              : c
          )
        );
      } else {
        setComments((prev) => [...prev, newComment]);
      }

      if (post) {
        setPost({ ...post, commentsCount: post.commentsCount + 1 });
      }

      setNewCommentText("");
      setReplyToId(null);
    } catch (err: unknown) {
      console.error("Failed to post comment:", err);
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      setCommentError(apiErr?.response?.data?.message || apiErr?.message || "Failed to submit comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      if (post) {
        setPost({ ...post, commentsCount: Math.max(0, post.commentsCount - 1) });
      }
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  const handleToggleCommentLike = async (commentId: string) => {
    if (!isAuthenticated) return;
    try {
      const res = await toggleCommentLike(commentId);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, isLiked: res.isLiked, likesCount: res.likesCount } : c
        )
      );
    } catch (err) {
      console.error("Failed to toggle comment like:", err);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;
    try {
      await reportUser(
        post.authorUsername,
        reportReason,
        reportDetails,
        post.id,
        undefined
      );
      setReportSubmitted(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSubmitted(false);
        setReportDetails("");
      }, 2000);
    } catch (err) {
      console.error("Failed to submit report:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-medinex-light flex flex-col items-center justify-center p-4">
        <div className="animate-spin w-8 h-8 border-4 border-medinex-teal border-t-transparent rounded-full mb-3" />
        <p className="text-xs text-medinex-muted font-medium">Loading community post...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-medinex-light flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-medinex-border text-center shadow-sm space-y-4">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-medinex-text">Post Not Found</h2>
          <p className="text-xs text-medinex-muted">
            This post may have been removed, hidden by moderation, or requires elevated access privileges.
          </p>
          <Link href="/community">
            <Button variant="primary" size="sm" className="w-full">
              Back to Community Feed
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isAuthorOrAdmin =
    user && (user.id === post.authorId || user.roles?.some((r) => r === "ROLE_ADMIN" || r === "ROLE_SUPER_ADMIN"));

  return (
    <div className="min-h-screen bg-medinex-light pb-20">
      {/* Top Header */}
      <div className="bg-white border-b border-medinex-border py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link
            href="/community"
            className="text-xs font-semibold text-medinex-teal hover:underline flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Community Feed</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="text-xs inline-flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? "Link Copied!" : "Share Post"}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Post Card */}
        <Card className="border border-medinex-border overflow-hidden shadow-xs">
          <CardBody className="p-6 space-y-5">
            {/* Author Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-500 to-emerald-700 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                  {post.authorFullName ? post.authorFullName.slice(0, 2).toUpperCase() : "MX"}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link
                      href={`/team/${post.authorUsername}`}
                      className="font-bold text-sm text-medinex-text hover:text-medinex-teal hover:underline"
                    >
                      {post.authorFullName}
                    </Link>
                    {post.isAuthorVerified && (
                      <span title="Verified Contributor">
                        <ShieldCheck className="w-4 h-4 text-medinex-teal" />
                      </span>
                    )}
                    {post.isOfficialAnnouncement && (
                      <Badge variant="mint" className="text-[10px] py-0">
                        Official
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-medinex-muted">
                    <span className="font-mono text-medinex-teal">@{post.authorUsername}</span>
                    <span>&bull;</span>
                    {post.authorDesignation && (
                      <>
                        <span>{post.authorDesignation}</span>
                        <span>&bull;</span>
                      </>
                    )}
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3" />
                      {new Date(post.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions: Edit / Delete / Report */}
              <div className="flex items-center gap-1">
                {isAuthorOrAdmin && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                      className="h-8 w-8 p-0 text-slate-500 hover:text-medinex-teal"
                      title="Edit Post"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      className="h-8 w-8 p-0 text-slate-500 hover:text-red-600"
                      title="Delete Post"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}
                {isAuthenticated && !post.isOwner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReportModal(true)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-amber-600"
                    title="Report Post"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Post Content or Edit Form */}
            {isEditing ? (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <textarea
                  rows={4}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-medinex-border focus:outline-none focus:border-medinex-teal"
                />
                <div className="flex items-center justify-between">
                  <select
                    value={editVisibility}
                    onChange={(e) => setEditVisibility(e.target.value as "PUBLIC" | "MEMBERS_ONLY" | "PRIVATE")}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-medinex-border bg-white text-slate-700"
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="MEMBERS_ONLY">Members Only</option>
                    <option value="PRIVATE">Private</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="text-xs">
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={isUpdatingPost}
                      className="text-xs"
                    >
                      {isUpdatingPost ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {post.content}
              </div>
            )}

            {/* Multiple Media Grid */}
            {post.media && post.media.length > 0 && (
              <div
                className={`grid gap-2.5 rounded-xl overflow-hidden mt-3 ${
                  post.media.length === 1 ? "grid-cols-1" : "grid-cols-2"
                }`}
              >
                {post.media.map((m, idx) => (
                  <div key={m.id || idx} className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                    <Image
                      src={m.mediaUrl}
                      alt={`Post attachment ${idx + 1}`}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Engagement Footer */}
            <div className="pt-3 border-t border-medinex-border flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    post.isLiked
                      ? "text-red-600 bg-red-50"
                      : "text-slate-600 hover:text-red-600 hover:bg-slate-50"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.isLiked ? "fill-red-600" : ""}`} />
                  <span>{post.likesCount}</span>
                </button>

                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 px-3 py-1.5">
                  <MessageSquare className="w-4 h-4" />
                  <span>{post.commentsCount} comments</span>
                </div>
              </div>

              <div className="text-[11px] text-medinex-muted flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>{post.visibility}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Discussion & Comments Thread */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-medinex-text flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-medinex-teal" />
            <span>Discussion Thread ({comments.length})</span>
          </h2>

          {/* New Comment Input */}
          <Card className="border border-medinex-border">
            <CardBody className="p-4 space-y-2">
              {commentError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">
                    <strong>Submission Blocked:</strong> {commentError}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCommentError(null)}
                    className="text-rose-500 hover:text-rose-700"
                    aria-label="Dismiss error"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {replyToId && (
                <div className="flex items-center justify-between text-xs text-medinex-teal bg-teal-50 px-3 py-1.5 rounded-lg mb-2">
                  <span>Replying to comment thread</span>
                  <button
                    type="button"
                    onClick={() => setReplyToId(null)}
                    className="p-1 hover:text-teal-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder={
                    isAuthenticated
                      ? replyToId
                        ? "Write a reply..."
                        : "Join the technical discussion..."
                      : "Sign in to contribute to discussion..."
                  }
                  disabled={!isAuthenticated}
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-medinex-border focus:outline-none focus:border-medinex-teal disabled:bg-slate-50"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!isAuthenticated || isSubmittingComment || !newCommentText.trim()}
                  className="shrink-0 text-xs"
                >
                  <Send className="w-3.5 h-3.5 mr-1" />
                  <span>Post</span>
                </Button>
              </form>
            </CardBody>
          </Card>

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="p-8 text-center text-xs text-medinex-muted bg-white rounded-2xl border border-medinex-border">
              No comments yet. Be the first innovator to start the conversation!
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <Card key={comment.id} className="border border-medinex-border">
                  <CardBody className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center">
                          {comment.authorFullName ? comment.authorFullName.slice(0, 2).toUpperCase() : "MX"}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-medinex-text">
                              {comment.authorFullName}
                            </span>
                            {comment.isAuthorVerified && (
                              <ShieldCheck className="w-3.5 h-3.5 text-medinex-teal" />
                            )}
                            <span className="text-[11px] font-mono text-medinex-teal">
                              @{comment.authorUsername}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {user && (user.id === comment.authorId || user.roles?.some((r) => r === "ROLE_ADMIN")) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-800 leading-relaxed pl-9">
                      {comment.content}
                    </p>

                    <div className="flex items-center gap-3 pl-9 pt-1">
                      <button
                        type="button"
                        onClick={() => handleToggleCommentLike(comment.id)}
                        className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${
                          comment.isLiked ? "text-red-600" : "text-slate-500 hover:text-red-600"
                        }`}
                      >
                        <Heart className={`w-3 h-3 ${comment.isLiked ? "fill-red-600" : ""}`} />
                        <span>{comment.likesCount}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReplyToId(comment.id)}
                        className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-medinex-teal"
                      >
                        <CornerDownRight className="w-3 h-3" />
                        <span>Reply</span>
                      </button>
                    </div>

                    {/* Nested Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-9 pl-3 border-l-2 border-teal-100 space-y-2 mt-2">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="p-2.5 rounded-xl bg-slate-50 space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-xs text-medinex-text">
                                  {reply.authorFullName}
                                </span>
                                <span className="text-[10px] font-mono text-medinex-teal">
                                  @{reply.authorUsername}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  &bull; {new Date(reply.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-medinex-border space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-medinex-border">
              <h3 className="font-bold text-sm text-medinex-text">Report Community Post</h3>
              <button
                onClick={() => setShowReportModal(false)}
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
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-medinex-text mb-1">
                    Reason for Report
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-medinex-border bg-white text-medinex-text"
                  >
                    <option value="INAPPROPRIATE_CONTENT">Inappropriate Content</option>
                    <option value="SPAM">Spam or Self-Promotion</option>
                    <option value="HARASSMENT">Harassment or Hate Speech</option>
                    <option value="FALSE_INFORMATION">False or Misleading Healthcare Information</option>
                    <option value="OTHER">Other Community Guideline Breach</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-medinex-text mb-1">
                    Details (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide additional context for moderators..."
                    className="w-full text-xs p-2.5 rounded-xl border border-medinex-border focus:outline-none focus:border-medinex-teal"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReportModal(false)}
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
