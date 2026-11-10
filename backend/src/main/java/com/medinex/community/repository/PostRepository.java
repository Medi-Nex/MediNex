package com.medinex.community.repository;

import com.medinex.community.entity.Post;
import com.medinex.community.entity.PostVisibility;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {

    @Query("SELECT p FROM Post p WHERE p.deletedAt IS NULL AND p.isHidden = false " +
           "AND p.visibility IN :visibilities " +
           "AND (:excludeAuthorIds IS NULL OR p.author.id NOT IN :excludeAuthorIds) " +
           "ORDER BY p.isPinned DESC, p.createdAt DESC")
    Page<Post> findFeedPosts(
            @Param("visibilities") Collection<PostVisibility> visibilities,
            @Param("excludeAuthorIds") Collection<UUID> excludeAuthorIds,
            Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.author.id = :authorId AND p.deletedAt IS NULL AND p.isHidden = false " +
           "AND p.visibility IN :visibilities " +
           "ORDER BY p.createdAt DESC")
    Page<Post> findUserPosts(
            @Param("authorId") UUID authorId,
            @Param("visibilities") Collection<PostVisibility> visibilities,
            Pageable pageable);

    Optional<Post> findByIdAndDeletedAtIsNull(UUID id);

    Page<Post> findByDeletedAtIsNull(Pageable pageable);

    Page<Post> findByDeletedAtIsNullAndIsHidden(boolean isHidden, Pageable pageable);

    long countByAuthorIdAndDeletedAtIsNull(UUID authorId);

    long countByDeletedAtIsNullAndIsHiddenTrue();
}
