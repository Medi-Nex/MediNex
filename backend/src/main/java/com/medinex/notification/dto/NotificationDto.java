package com.medinex.notification.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.medinex.notification.entity.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private UUID id;
    private NotificationType type;
    private String message;

    @JsonProperty("isRead")
    private boolean isRead;

    private String targetType;
    private UUID targetId;
    private Instant createdAt;
    private String actorUsername;
    private String actorFullName;
    private String actorAvatarUrl;
    private String actorAvatarSmUrl;
}
