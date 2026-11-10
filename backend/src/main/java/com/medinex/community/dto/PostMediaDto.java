package com.medinex.community.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostMediaDto {
    private UUID id;
    private String mediaUrl;
    private String mediaType;
    private long fileSizeBytes;
    private int displayOrder;
}
