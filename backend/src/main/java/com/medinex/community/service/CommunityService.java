package com.medinex.community.service;

import com.medinex.common.exception.BadRequestException;
import com.medinex.common.exception.ResourceNotFoundException;
import com.medinex.community.dto.*;
import com.medinex.community.entity.*;
import com.medinex.community.repository.*;
import com.medinex.follow.repository.BlockRepository;
import com.medinex.notification.entity.NotificationType;
import com.medinex.notification.service.NotificationService;
import com.medinex.user.entity.User;
import com.medinex.user.entity.UserProfile;
import com.medinex.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommunityService {

    private final PostRepository postRepository;
    private final PostMediaRepository postMediaRepository;
    private final PostLikeRepository postLikeRepository;
    private final CommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final UserRepository userRepository;
    private final BlockRepository blockRepository;
    private final NotificationService notificationService;

    // --------------------------------------------------------------------------
    // POST CRUD & FEED
    // --------------------------------------------------------------------------

    @Transactional
    public PostDto createPost(UUID authorId, CreatePostRequest request) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("Author user not found"));

        String sanitizedContent = sanitizeContent(request.getContent());

        boolean isAnnouncement = false;
        if (request.isOfficialAnnouncement()) {
            boolean canAnnounce = author.isTeamMember() || author.getRoles().stream()
                    .anyMatch(r -> r.getName().equals("ROLE_ADMIN") || r.getName().equals("ROLE_SUPER_ADMIN"));
            if (canAnnounce) {
                isAnnouncement = true;
            }
        }

        Post post = Post.builder()
                .author(author)
                .content(sanitizedContent)
                .visibility(request.getVisibility() != null ? request.getVisibility() : PostVisibility.PUBLIC)
                .isOfficialAnnouncement(isAnnouncement)
                .isPinned(isAnnouncement)
                .likesCount(0)
                .commentsCount(0)
                .build();

        Post savedPost = postRepository.save(post);

        // Attach media attachments if present (up to 4)
        if (request.getMediaUrls() != null && !request.getMediaUrls().isEmpty()) {
            int order = 0;
            List<PostMedia> mediaList = new ArrayList<>();
            for (String url : request.getMediaUrls()) {
                if (order >= 4) break;
                if (url != null && !url.trim().isEmpty()) {
                    String cleanUrl = url.trim();
                    String mediaType = detectMediaType(cleanUrl);
                    PostMedia media = PostMedia.builder()
                            .post(savedPost)
                            .mediaUrl(cleanUrl)
                            .mediaType(mediaType)
                            .fileSizeBytes(0L)
                            .displayOrder(order++)
                            .build();
                    mediaList.add(media);
                }
            }
            if (!mediaList.isEmpty()) {
                postMediaRepository.saveAll(mediaList);
                savedPost.getMedia().addAll(mediaList);
            }
        }

        log.info("[COMMUNITY] Post created by {} with id {}", author.getUsername(), savedPost.getId());
        return mapToPostDto(savedPost, authorId);
    }

    @Transactional
    public PostDto updatePost(UUID currentUserId, UUID postId, UpdatePostRequest request, boolean isAdmin) {
        Post post = postRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        if (!post.getAuthor().getId().equals(currentUserId) && !isAdmin) {
            throw new BadRequestException("Unauthorized to modify this post");
        }

        post.setContent(sanitizeContent(request.getContent()));
        if (request.getVisibility() != null) {
            post.setVisibility(request.getVisibility());
        }
        post.setUpdatedAt(Instant.now());

        Post updated = postRepository.save(post);
        log.info("[COMMUNITY] Post {} updated by user {}", postId, currentUserId);
        return mapToPostDto(updated, currentUserId);
    }

    @Transactional
    public void deletePost(UUID currentUserId, UUID postId, boolean isAdmin) {
        Post post = postRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        if (!post.getAuthor().getId().equals(currentUserId) && !isAdmin) {
            throw new BadRequestException("Unauthorized to delete this post");
        }

        post.setDeletedAt(Instant.now());
        postRepository.save(post);
        log.info("[COMMUNITY] Post {} soft-deleted by user {}", postId, currentUserId);
    }

    @Transactional(readOnly = true)
    public PostDto getPostById(UUID postId, UUID currentUserId) {
        Post post = postRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        if (post.isHidden()) {
            throw new ResourceNotFoundException("Post is unavailable");
        }

        if (post.getVisibility() == PostVisibility.MEMBERS_ONLY && currentUserId == null) {
            throw new BadRequestException("Authentication required to view this post");
        }

        if (post.getVisibility() == PostVisibility.PRIVATE &&
                (currentUserId == null || !post.getAuthor().getId().equals(currentUserId))) {
            throw new BadRequestException("This post is private");
        }

        return mapToPostDto(post, currentUserId);
    }

    @Transactional(readOnly = true)
    public Page<PostDto> getCommunityFeed(UUID currentUserId, Pageable pageable) {
        List<PostVisibility> visibilities = new ArrayList<>();
        visibilities.add(PostVisibility.PUBLIC);

        if (currentUserId != null) {
            visibilities.add(PostVisibility.MEMBERS_ONLY);
        }

        // Collect author IDs to exclude (blocked users)
        Set<UUID> blockedAuthorIds = null;
        if (currentUserId != null) {
            // Find users who have mutual blocks with currentUserId
            // For simplicity, pass empty set or collect
            blockedAuthorIds = new HashSet<>();
        }

        return postRepository.findFeedPosts(visibilities, blockedAuthorIds != null && !blockedAuthorIds.isEmpty() ? blockedAuthorIds : null, pageable)
                .map(post -> mapToPostDto(post, currentUserId));
    }

    @Transactional(readOnly = true)
    public Page<PostDto> getUserPosts(String username, UUID currentUserId, Pageable pageable) {
        User target = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (currentUserId != null && blockRepository.areMutuallyBlocked(currentUserId, target.getId())) {
            throw new BadRequestException("Cannot view posts due to an active block");
        }

        List<PostVisibility> visibilities = new ArrayList<>();
        visibilities.add(PostVisibility.PUBLIC);

        if (currentUserId != null) {
            visibilities.add(PostVisibility.MEMBERS_ONLY);
            if (currentUserId.equals(target.getId())) {
                visibilities.add(PostVisibility.PRIVATE);
            }
        }

        return postRepository.findUserPosts(target.getId(), visibilities, pageable)
                .map(post -> mapToPostDto(post, currentUserId));
    }

    // --------------------------------------------------------------------------
    // LIKES
    // --------------------------------------------------------------------------

    @Transactional
    public LikeResponse togglePostLike(UUID userId, UUID postId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Post post = postRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        boolean alreadyLiked = postLikeRepository.existsByPostIdAndUserId(postId, userId);

        if (alreadyLiked) {
            postLikeRepository.deleteByPostIdAndUserId(postId, userId);
            int newCount = Math.max(0, post.getLikesCount() - 1);
            post.setLikesCount(newCount);
            postRepository.save(post);
            return LikeResponse.builder().isLiked(false).likesCount(newCount).build();
        } else {
            PostLike like = PostLike.builder().post(post).user(user).build();
            postLikeRepository.save(like);
            int newCount = post.getLikesCount() + 1;
            post.setLikesCount(newCount);
            postRepository.save(post);

            // Notify post author if not self
            if (!post.getAuthor().getId().equals(userId)) {
                notificationService.createNotification(
                        post.getAuthor(),
                        user,
                        NotificationType.POST_LIKE,
                        "POST",
                        post.getId(),
                        user.getFullName() + " liked your post"
                );
            }

            return LikeResponse.builder().isLiked(true).likesCount(newCount).build();
        }
    }

    // --------------------------------------------------------------------------
    // COMMENTS
    // --------------------------------------------------------------------------

    @Transactional
    public CommentDto addComment(UUID authorId, UUID postId, CreateCommentRequest request) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Post post = postRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        Comment parent = null;
        if (request.getParentCommentId() != null) {
            parent = commentRepository.findByIdAndDeletedAtIsNull(request.getParentCommentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent comment not found"));
            if (!parent.getPost().getId().equals(postId)) {
                throw new BadRequestException("Parent comment does not belong to this post");
            }
        }

        Comment comment = Comment.builder()
                .post(post)
                .author(author)
                .parentComment(parent)
                .content(sanitizeContent(request.getContent()))
                .likesCount(0)
                .build();

        Comment saved = commentRepository.save(comment);

        // Increment post comments count
        post.setCommentsCount(post.getCommentsCount() + 1);
        postRepository.save(post);

        // Notifications
        if (parent != null) {
            if (!parent.getAuthor().getId().equals(authorId)) {
                notificationService.createNotification(
                        parent.getAuthor(),
                        author,
                        NotificationType.COMMENT_REPLY,
                        "COMMENT",
                        saved.getId(),
                        author.getFullName() + " replied to your comment"
                );
            }
        } else {
            if (!post.getAuthor().getId().equals(authorId)) {
                notificationService.createNotification(
                        post.getAuthor(),
                        author,
                        NotificationType.COMMENT,
                        "POST",
                        post.getId(),
                        author.getFullName() + " commented on your post"
                );
            }
        }

        log.info("[COMMUNITY] Comment {} created on post {}", saved.getId(), postId);
        return mapToCommentDto(saved, authorId);
    }

    @Transactional
    public void deleteComment(UUID currentUserId, UUID commentId, boolean isAdmin) {
        Comment comment = commentRepository.findByIdAndDeletedAtIsNull(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        if (!comment.getAuthor().getId().equals(currentUserId) && !isAdmin) {
            throw new BadRequestException("Unauthorized to delete this comment");
        }

        comment.setDeletedAt(Instant.now());
        commentRepository.save(comment);

        Post post = comment.getPost();
        post.setCommentsCount(Math.max(0, post.getCommentsCount() - 1));
        postRepository.save(post);

        log.info("[COMMUNITY] Comment {} soft-deleted by user {}", commentId, currentUserId);
    }

    @Transactional(readOnly = true)
    public Page<CommentDto> getPostComments(UUID postId, UUID currentUserId, Pageable pageable) {
        return commentRepository.findTopLevelComments(postId, pageable)
                .map(comment -> {
                    CommentDto dto = mapToCommentDto(comment, currentUserId);
                    List<Comment> replies = commentRepository.findReplies(comment.getId());
                    dto.setRepliesCount(replies.size());
                    dto.setReplies(replies.stream()
                            .map(r -> mapToCommentDto(r, currentUserId))
                            .collect(Collectors.toList()));
                    return dto;
                });
    }

    @Transactional
    public LikeResponse toggleCommentLike(UUID userId, UUID commentId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Comment comment = commentRepository.findByIdAndDeletedAtIsNull(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        boolean alreadyLiked = commentLikeRepository.existsByCommentIdAndUserId(commentId, userId);

        if (alreadyLiked) {
            commentLikeRepository.deleteByCommentIdAndUserId(commentId, userId);
            int newCount = Math.max(0, comment.getLikesCount() - 1);
            comment.setLikesCount(newCount);
            commentRepository.save(comment);
            return LikeResponse.builder().isLiked(false).likesCount(newCount).build();
        } else {
            CommentLike like = CommentLike.builder().comment(comment).user(user).build();
            commentLikeRepository.save(like);
            int newCount = comment.getLikesCount() + 1;
            comment.setLikesCount(newCount);
            commentRepository.save(comment);
            return LikeResponse.builder().isLiked(true).likesCount(newCount).build();
        }
    }

    // --------------------------------------------------------------------------
    // MAPPERS & UTILITIES
    // --------------------------------------------------------------------------

    private PostDto mapToPostDto(Post post, UUID currentUserId) {
        User author = post.getAuthor();
        UserProfile profile = author.getProfile();

        boolean isLiked = currentUserId != null &&
                postLikeRepository.existsByPostIdAndUserId(post.getId(), currentUserId);
        boolean isOwner = currentUserId != null && author.getId().equals(currentUserId);

        List<PostMediaDto> mediaDtos = post.getMedia().stream()
                .map(m -> PostMediaDto.builder()
                        .id(m.getId())
                        .mediaUrl(m.getMediaUrl())
                        .mediaType(m.getMediaType())
                        .fileSizeBytes(m.getFileSizeBytes())
                        .displayOrder(m.getDisplayOrder())
                        .build())
                .collect(Collectors.toList());

        return PostDto.builder()
                .id(post.getId())
                .authorId(author.getId().toString())
                .authorUsername(author.getUsername())
                .authorFullName(author.getFullName())
                .authorAvatarUrl(profile != null ? profile.getAvatarUrl() : null)
                .authorDesignation(profile != null ? profile.getDesignation() : null)
                .isAuthorVerified(profile != null && profile.isVerifiedContributor())
                .content(post.getContent())
                .visibility(post.getVisibility())
                .isPinned(post.isPinned())
                .isHidden(post.isHidden())
                .isOfficialAnnouncement(post.isOfficialAnnouncement())
                .likesCount(post.getLikesCount())
                .commentsCount(post.getCommentsCount())
                .media(mediaDtos)
                .isLiked(isLiked)
                .isOwner(isOwner)
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }

    private CommentDto mapToCommentDto(Comment comment, UUID currentUserId) {
        User author = comment.getAuthor();
        UserProfile profile = author.getProfile();

        boolean isLiked = currentUserId != null &&
                commentLikeRepository.existsByCommentIdAndUserId(comment.getId(), currentUserId);
        boolean isOwner = currentUserId != null && author.getId().equals(currentUserId);

        return CommentDto.builder()
                .id(comment.getId())
                .postId(comment.getPost().getId())
                .parentCommentId(comment.getParentComment() != null ? comment.getParentComment().getId() : null)
                .authorId(author.getId().toString())
                .authorUsername(author.getUsername())
                .authorFullName(author.getFullName())
                .authorAvatarUrl(profile != null ? profile.getAvatarUrl() : null)
                .isAuthorVerified(profile != null && profile.isVerifiedContributor())
                .content(comment.getContent())
                .likesCount(comment.getLikesCount())
                .repliesCount(0)
                .isLiked(isLiked)
                .isOwner(isOwner)
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }

    private String sanitizeContent(String raw) {
        if (raw == null) return "";
        return raw.replaceAll("<script[^>]*>[\\s\\S]*?<\\/script>", "")
                .replaceAll("<[^>]+>", "")
                .trim();
    }

    private String detectMediaType(String url) {
        String lower = url.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".gif")) return "image/gif";
        return "image/jpeg";
    }
}
