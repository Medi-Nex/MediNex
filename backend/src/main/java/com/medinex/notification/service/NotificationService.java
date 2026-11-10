package com.medinex.notification.service;

import com.medinex.common.exception.ResourceNotFoundException;
import com.medinex.notification.dto.NotificationDto;
import com.medinex.notification.entity.Notification;
import com.medinex.notification.entity.NotificationType;
import com.medinex.notification.repository.NotificationRepository;
import com.medinex.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public Notification createNotification(
            User recipient,
            User actor,
            NotificationType type,
            String targetType,
            UUID targetId,
            String message) {
        
        // Don't notify oneself
        if (actor != null && recipient != null && recipient.getId().equals(actor.getId())) {
            return null;
        }

        Notification notification = Notification.builder()
                .recipient(recipient)
                .actor(actor)
                .type(type)
                .targetType(targetType)
                .targetId(targetId)
                .message(message)
                .isRead(false)
                .build();

        return notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public Page<NotificationDto> getUserNotifications(UUID recipientId, Pageable pageable) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId, pageable)
                .map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID recipientId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(recipientId);
    }

    @Transactional
    public void markAsRead(UUID recipientId, UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        if (!notification.getRecipient().getId().equals(recipientId)) {
            throw new IllegalArgumentException("Cannot modify notifications belonging to other users");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(UUID recipientId) {
        notificationRepository.markAllAsRead(recipientId);
    }

    private NotificationDto mapToDto(Notification entity) {
        String actorUsername = null;
        String actorFullName = null;
        String actorAvatarUrl = null;

        if (entity.getActor() != null) {
            actorUsername = entity.getActor().getUsername();
            actorFullName = entity.getActor().getFullName();
            if (entity.getActor().getProfile() != null) {
                actorAvatarUrl = entity.getActor().getProfile().getAvatarUrl();
            }
        }

        return NotificationDto.builder()
                .id(entity.getId())
                .type(entity.getType())
                .message(entity.getMessage())
                .isRead(entity.isRead())
                .targetType(entity.getTargetType())
                .targetId(entity.getTargetId())
                .createdAt(entity.getCreatedAt())
                .actorUsername(actorUsername)
                .actorFullName(actorFullName)
                .actorAvatarUrl(actorAvatarUrl)
                .build();
    }
}
