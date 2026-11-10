package com.medinex.follow.repository;

import com.medinex.follow.entity.Block;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BlockRepository extends JpaRepository<Block, UUID> {

    boolean existsByBlockerIdAndBlockedId(UUID blockerId, UUID blockedId);

    Optional<Block> findByBlockerIdAndBlockedId(UUID blockerId, UUID blockedId);

    void deleteByBlockerIdAndBlockedId(UUID blockerId, UUID blockedId);

    List<Block> findByBlockerIdOrderByCreatedAtDesc(UUID blockerId);

    @Query("SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END FROM Block b " +
            "WHERE (b.blocker.id = :userA AND b.blocked.id = :userB) " +
            "   OR (b.blocker.id = :userB AND b.blocked.id = :userA)")
    boolean areMutuallyBlocked(@Param("userA") UUID userA, @Param("userB") UUID userB);
}
