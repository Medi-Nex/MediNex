package com.medinex.team.repository;

import com.medinex.team.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, UUID> {
    List<TeamMember> findAllByTeamSlugOrderByDisplayOrderAsc(String teamSlug);
    List<TeamMember> findAllByOrderByDisplayOrderAsc();
    Optional<TeamMember> findByUserUsernameIgnoreCase(String username);
}
