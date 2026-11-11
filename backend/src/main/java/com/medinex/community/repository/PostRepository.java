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

    @Query("SELECT p FROM Post p " +
           "LEFT JOIN p.author.profile prof " +
           "WHERE p.deletedAt IS NULL AND p.isHidden = false " +
           "AND p.visibility IN :visibilities " +
           "AND (:viewerId IS NULL OR NOT EXISTS (" +
           "    SELECT b.id FROM Block b " +
           "    WHERE (b.blocker.id = :viewerId AND b.blocked.id = p.author.id) " +
           "       OR (b.blocker.id = p.author.id AND b.blocked.id = :viewerId)" +
           ")) " +
           "AND (" +
           "    prof IS NULL OR prof.isPublicVisible = true " +
           "    OR (:viewerId IS NOT NULL AND (" +
           "        p.author.id = :viewerId " +
           "        OR EXISTS (SELECT uf.id FROM UserFollow uf WHERE uf.follower.id = :viewerId AND uf.following.id = p.author.id)" +
           "    ))" +
           ") " +
           "ORDER BY p.isPinned DESC, p.createdAt DESC")
    Page<Post> findFeedPosts(
            @Param("visibilities") Collection<PostVisibility> visibilities,
            @Param("viewerId") UUID viewerId,
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
