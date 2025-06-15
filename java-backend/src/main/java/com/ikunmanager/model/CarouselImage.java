package com.ikunmanager.model;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CarouselImage {
    private Long id;
    private String imageUrl;
    private String title;
    private String linkUrl;
    private Integer displayOrder;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 