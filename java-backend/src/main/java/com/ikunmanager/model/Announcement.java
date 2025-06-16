package com.ikunmanager.model;

import lombok.Data;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonFormat;

@Data
public class Announcement {
    private Long id;
    private String title;
    private String content;
    @JsonProperty("author_name")
    private String authorName;
    @JsonProperty("status")
    private String status; // published / draft
    @JsonProperty("is_pinned")
    private Integer isPinned; // 0|1
    @JsonProperty("published_at")
    private LocalDateTime publishedAt;
    @JsonProperty("created_at")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    @JsonProperty("updated_at")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
} 