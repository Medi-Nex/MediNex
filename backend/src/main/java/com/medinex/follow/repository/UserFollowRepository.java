package com.medinex.follow.repository;

import com.medinex.follow.entity.UserFollow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserFollowRepository extends JpaRepository<UserFollow, UUID> {

    boolean existsByFollowerIdAndFollowingId(UUID followerId, UUID followingId);

    Optional<UserFollow> findByFollowerIdAndFollowingId(UUID followerId, UUID followingId);

    long countByFollowingId(UUID followingId);

    long countByFollowerId(UUID followerId);

    Page<UserFollow> findByFollowingIdOrderByCreatedAtDesc(UUID followingId, Pageable pageable);

    Page<UserFollow> findByFollowerIdOrderByCreatedAtDesc(UUID followerId, Pageable pageable);

    void deleteByFollowerIdAndFollowingId(UUID followerId, UUID followingId);

    @Modifying
    @Query("DELETE FROM UserFollow uf WHERE (uf.follower.id = :userA AND uf.following.id = :userB) OR (uf.follower.id = :userB AND uf.following.id = :userA)")
    void deleteMutualFollows(@Param("userA") UUID userA, @Param("userB") UUID userB);
}
