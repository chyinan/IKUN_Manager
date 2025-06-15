package com.ikunmanager.service;

import com.ikunmanager.model.CarouselImage;
import java.util.List;

public interface CarouselService {
    List<CarouselImage> getAllActiveCarouselImages();
    CarouselImage getCarouselImageById(Long id);
    CarouselImage addCarouselImage(CarouselImage carouselImage);
    CarouselImage updateCarouselImage(CarouselImage carouselImage);
    void deleteCarouselImage(Long id);
    void batchDeleteCarouselImages(List<Long> ids);
} 