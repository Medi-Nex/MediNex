package com.medinex.community.repository;

import com.medinex.community.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {

    @Query("SELECT c FROM Comment c WHERE c.post.id = :postId " +
           "AND c.parentComment IS NULL " +
           "AND c.deletedAt IS NULL AND c.isHidden = false " +
           "ORDER BY c.createdAt ASC")
    Page<Comment> findTopLevelComments(@Param("postId") UUID postId, Pageable pageable);

    @Query("SELECT c FROM Comment c WHERE c.parentComment.id = :parentId " +
           "AND c.deletedAt IS NULL AND c.isHidden = false " +
           "ORDER BY c.createdAt ASC")
    List<Comment> findReplies(@Param("parentId") UUID parentId);

    long countByPostIdAndDeletedAtIsNullAndIsHiddenFalse(UUID postId);

    long countByParentCommentIdAndDeletedAtIsNullAndIsHiddenFalse(UUID parentId);

    Optional<Comment> findByIdAndDeletedAtIsNull(UUID id);

    Page<Comment> findByDeletedAtIsNull(Pageable pageable);

    Page<Comment> findByDeletedAtIsNullAndIsHidden(boolean isHidden, Pageable pageable);

    long countByDeletedAtIsNullAndIsHiddenTrue();
}
