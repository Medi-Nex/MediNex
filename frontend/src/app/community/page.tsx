"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Heart,
  Share2,
  Send,
  Info,
  Lock,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Post } from "@/types";

// Clearly labeled seed posts for UI testing and preview
const DEMO_SEED_POSTS: Post[] = [
  {
    id: "demo-post-1",
    authorUsername: "contributor-01",
    authorName: "Contributor 01 [Placeholder]",
    authorDesignation: "Team Lead & Systems Architect",
    isOfficialAnnouncement: true,
    content:
      "[DEMO SEED CONTENT] Welcome to the MediNex Community feed! This is an interactive preview of our healthcare community feed. All community interactions adhere to strict data governance with zero PHI.",
    likesCount: 1,
    commentsCount: 0,
    isLiked: false,
    createdAt: "2026-02-10T12:00:00Z",
    isSeedDemo: true,
  },
  {
    id: "demo-post-2",
    authorUsername: "contributor-04",
    authorName: "Contributor 04 [Placeholder]",
    authorDesignation: "Telemedicine & Mobile Integration Lead",
    isOfficialAnnouncement: false,
    content:
      "[DEMO SEED CONTENT] Researching low-latency audio transmission strategies over high-jitter 2G networks for the ShasthoSetu community triage bridge. We are exploring opus codecs with dynamic bitrate adjustment.",
    likesCount: 0,
    commentsCount: 0,
    isLiked: false,
    createdAt: "2026-02-09T16:30:00Z",
    isSeedDemo: true,
  },
];

export default function CommunityFeedPage() {
  const [showDemoPosts, setShowDemoPosts] = useState<boolean>(true);
  const [posts, setPosts] = useState<Post[]>(DEMO_SEED_POSTS);
  const [newPostContent, setNewPostContent] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "OFFICIAL">("ALL");

  const displayedPosts = (showDemoPosts ? posts : []).filter((p) => {
    if (filterType === "OFFICIAL") return p.isOfficialAnnouncement;
    return true;
  });

  const handleLike = (postId: string) => {
    // In Phase 1, toggle like locally for preview
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = !p.isLiked;
          return {
            ...p,
            isLiked,
            likesCount: isLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
          };
        }
        return p;
      })
    );
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const newPost: Post = {
      id: `local-post-${Date.now()}`,
      authorUsername: "current-guest-user",
      authorName: "Guest Innovator (Local Preview)",
      authorDesignation: "Community Participant",
      isOfficialAnnouncement: false,
      content: newPostContent,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
      isSeedDemo: false,
    };

    setPosts([newPost, ...posts]);
    setNewPostContent("");
  };

  return (
    <div className="flex flex-col min-h-screen bg-medinex-light pb-20">
      {/* Dark Header */}
      <section className="bg-medinex-dark text-white py-14 border-b border-emerald-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <Badge variant="mint">Public Community Feed</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            MediNex Community Discourse
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            Discuss open-source health tech, provide feedback on ShasthoSetu, and follow official
            E-Health Hackathon 2026 development updates.
          </p>
        </div>
      </section>

      {/* Demo Content Toggle Banner */}
      <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-3">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Transparency Disclosure:</strong> Live community posts are marked clearly. You can toggle seed/demo items below to inspect empty state vs populated state.
            </span>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-amber-800">
              <input
                type="checkbox"
                checked={showDemoPosts}
                onChange={(e) => setShowDemoPosts(e.target.checked)}
                className="rounded border-amber-400 text-medinex-teal focus:ring-medinex-teal"
              />
              <span>Show Seed / Demo Content</span>
            </label>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-8 space-y-6 w-full">
        {/* Post Creation Box */}
        <Card className="shadow-subtle">
          <CardBody className="p-4 sm:p-5">
            <form onSubmit={handleCreatePost} className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-medinex-deep shrink-0">
                  <User className="w-5 h-5 text-slate-500" />
                </div>
                <div className="flex-1">
                  <textarea
                    rows={3}
                    placeholder="Share an insight, question, or feedback on healthcare innovation (No PHI or patient data)..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="w-full text-xs sm:text-sm p-3 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-medinex-teal resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-medinex-teal" />
                  <span>Public Community Domain</span>
                </div>
                <Button type="submit" variant="primary" size="sm" disabled={!newPostContent.trim()}>
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  <span>Publish Post</span>
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Filter Bar */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === "ALL"
                  ? "bg-medinex-teal text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              All Discussions
            </button>
            <button
              onClick={() => setFilterType("OFFICIAL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === "OFFICIAL"
                  ? "bg-medinex-teal text-white shadow-sm"
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
        {displayedPosts.length === 0 ? (
          /* Empty State */
          <Card className="text-center py-16 px-4">
            <CardBody className="space-y-4 max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-medinex-teal flex items-center justify-center mx-auto">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-medinex-text">No Community Posts Yet</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Be the first healthcare engineer, medical student, or innovator to post! If you wish to see
                sample layout posts, re-enable &quot;Show Seed / Demo Content&quot; above.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDemoPosts(true)}
              >
                Enable Demo Content Preview
              </Button>
            </CardBody>
          </Card>
        ) : (
          displayedPosts.map((post) => (
            <Card key={post.id} className="shadow-subtle">
              <CardBody className="p-5 space-y-4">
                {/* Author row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-sm text-medinex-deep">
                      {post.authorUsername.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-medinex-text">{post.authorName}</span>
                        {post.isOfficialAnnouncement && (
                          <Badge variant="teal" size="sm">
                            Official Announcement
                          </Badge>
                        )}
                        {post.isSeedDemo && (
                          <Badge variant="placeholder" size="sm">
                            Demo Content
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        @{post.authorUsername} &bull; {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>

                {/* Interaction Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                      post.isLiked
                        ? "text-red-600 bg-red-50 font-semibold"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${post.isLiked ? "fill-current" : ""}`} />
                    <span>{post.likesCount} {post.likesCount === 1 ? "Like" : "Likes"}</span>
                  </button>

                  <button
                    onClick={() => alert("Comments expand in Phase 4.")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.commentsCount} Comments</span>
                  </button>

                  <button
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        navigator.clipboard.writeText(`${window.location.origin}/community#${post.id}`);
                        alert("Post link copied to clipboard!");
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
