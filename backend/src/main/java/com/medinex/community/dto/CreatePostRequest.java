package com.medinex.community.dto;

import com.medinex.community.entity.PostVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePostRequest {

    @NotBlank(message = "Post content cannot be empty")
    @Size(max = 5000, message = "Post content cannot exceed 5000 characters")
    private String content;

    @Builder.Default
    private PostVisibility visibility = PostVisibility.PUBLIC;

    @Builder.Default
    private List<String> mediaUrls = new ArrayList<>();

    @Builder.Default
    private boolean isOfficialAnnouncement = false;
}
