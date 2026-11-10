package com.medinex.follow.repository;

import com.medinex.follow.entity.FollowRequest;
import com.medinex.follow.entity.FollowRequestStatus;
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
public interface FollowRequestRepository extends JpaRepository<FollowRequest, UUID> {

    boolean existsByRequesterIdAndTargetIdAndStatus(UUID requesterId, UUID targetId, FollowRequestStatus status);

    Optional<FollowRequest> findByRequesterIdAndTargetId(UUID requesterId, UUID targetId);

    Page<FollowRequest> findByTargetIdAndStatusOrderByCreatedAtDesc(UUID targetId, FollowRequestStatus status, Pageable pageable);

    long countByTargetIdAndStatus(UUID targetId, FollowRequestStatus status);

    @Modifying
    @Query("DELETE FROM FollowRequest fr WHERE (fr.requester.id = :userA AND fr.target.id = :userB) OR (fr.requester.id = :userB AND fr.target.id = :userA)")
    void deleteMutualRequests(@Param("userA") UUID userA, @Param("userB") UUID userB);
}
