package com.medinex.follow.repository;

import com.medinex.follow.entity.TeamFollow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamFollowRepository extends JpaRepository<TeamFollow, UUID> {

    boolean existsByFollowerIdAndTeamId(UUID followerId, UUID teamId);

    Optional<TeamFollow> findByFollowerIdAndTeamId(UUID followerId, UUID teamId);

    long countByTeamId(UUID teamId);

    long countByFollowerId(UUID followerId);

    Page<TeamFollow> findByTeamIdOrderByCreatedAtDesc(UUID teamId, Pageable pageable);

    Page<TeamFollow> findByFollowerIdOrderByCreatedAtDesc(UUID followerId, Pageable pageable);

    void deleteByFollowerIdAndTeamId(UUID followerId, UUID teamId);
}
