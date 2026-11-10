package com.medinex.community.controller;

import com.medinex.common.api.ApiResponse;
import com.medinex.common.security.UserPrincipal;
import com.medinex.community.dto.*;
import com.medinex.community.service.CommunityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/community")
@RequiredArgsConstructor
@Tag(name = "Community Feed & Social Platform", description = "Endpoints for community posts, nested comments, media attachments, and social reactions")
public class CommunityController {

    private final CommunityService communityService;

    // --------------------------------------------------------------------------
    // FEED & POSTS
    // --------------------------------------------------------------------------

    @GetMapping("/feed")
    @Operation(summary = "Get paginated community feed")
    public ApiResponse<Page<PostDto>> getFeed(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        UUID currentUserId = principal != null ? principal.getId() : null;
        Page<PostDto> feed = communityService.getCommunityFeed(currentUserId, pageable);
        return ApiResponse.ok(feed, "Community feed retrieved");
    }

    @GetMapping("/posts/{id}")
    @Operation(summary = "Get single post by ID")
    public ApiResponse<PostDto> getPostById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID currentUserId = principal != null ? principal.getId() : null;
        PostDto post = communityService.getPostById(id, currentUserId);
        return ApiResponse.ok(post, "Post retrieved");
    }

    @GetMapping("/users/{username}/posts")
    @Operation(summary = "Get posts published by a user")
    public ApiResponse<Page<PostDto>> getUserPosts(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String username,
            @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        UUID currentUserId = principal != null ? principal.getId() : null;
        Page<PostDto> posts = communityService.getUserPosts(username, currentUserId, pageable);
        return ApiResponse.ok(posts, "User posts retrieved");
    }

    @PostMapping("/posts")
    @SecurityRequirement(name = "BearerAuth")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Create a new text or media post")
    public ApiResponse<PostDto> createPost(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreatePostRequest request) {
        PostDto created = communityService.createPost(principal.getId(), request);
        return ApiResponse.ok(created, "Post published successfully");
    }

    @PutMapping("/posts/{id}")
    @SecurityRequirement(name = "BearerAuth")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update post content or visibility")
    public ApiResponse<PostDto> updatePost(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePostRequest request) {
        boolean isAdmin = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));
        PostDto updated = communityService.updatePost(principal.getId(), id, request, isAdmin);
        return ApiResponse.ok(updated, "Post updated successfully");
    }

    @DeleteMapping("/posts/{id}")
    @SecurityRequirement(name = "BearerAuth")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Soft delete a post")
    public ApiResponse<Void> deletePost(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        boolean isAdmin = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));
        communityService.deletePost(principal.getId(), id, isAdmin);
        return ApiResponse.ok(null, "Post deleted successfully");
    }

    // --------------------------------------------------------------------------
    // LIKES
    // --------------------------------------------------------------------------

    @PostMapping("/posts/{id}/like")
    @SecurityRequirement(name = "BearerAuth")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Toggle like/unlike on a post")
    public ApiResponse<LikeResponse> togglePostLike(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        LikeResponse res = communityService.togglePostLike(principal.getId(), id);
        return ApiResponse.ok(res, res.isLiked() ? "Post liked" : "Post unliked");
    }

    // --------------------------------------------------------------------------
    // COMMENTS
    // --------------------------------------------------------------------------

    @GetMapping("/posts/{id}/comments")
    @Operation(summary = "Get comments for a post")
    public ApiResponse<Page<CommentDto>> getPostComments(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.ASC) Pageable pageable) {
        UUID currentUserId = principal != null ? principal.getId() : null;
        Page<CommentDto> comments = communityService.getPostComments(id, currentUserId, pageable);
        return ApiResponse.ok(comments, "Comments retrieved");
    }

    @PostMapping("/posts/{id}/comments")
    @SecurityRequirement(name = "BearerAuth")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Add a comment or reply to a post")
    public ApiResponse<CommentDto> addComment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody CreateCommentRequest request) {
        CommentDto comment = communityService.addComment(principal.getId(), id, request);
        return ApiResponse.ok(comment, "Comment submitted successfully");
    }

    @DeleteMapping("/comments/{commentId}")
    @SecurityRequirement(name = "BearerAuth")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Soft delete a comment")
    public ApiResponse<Void> deleteComment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID commentId) {
        boolean isAdmin = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));
        communityService.deleteComment(principal.getId(), commentId, isAdmin);
        return ApiResponse.ok(null, "Comment deleted successfully");
    }

    @PostMapping("/comments/{commentId}/like")
    @SecurityRequirement(name = "BearerAuth")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Toggle like/unlike on a comment")
    public ApiResponse<LikeResponse> toggleCommentLike(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID commentId) {
        LikeResponse res = communityService.toggleCommentLike(principal.getId(), commentId);
        return ApiResponse.ok(res, res.isLiked() ? "Comment liked" : "Comment unliked");
    }
}
