package com.ikunmanager.service.impl;

import com.ikunmanager.mapper.CarouselMapper;
import com.ikunmanager.model.CarouselImage;
import com.ikunmanager.service.CarouselService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CarouselServiceImpl implements CarouselService {

    @Autowired
    private CarouselMapper carouselMapper;

    @Override
    public List<CarouselImage> getAllActiveCarouselImages() {
        return carouselMapper.findAllActive();
    }

    @Override
    public CarouselImage getCarouselImageById(Long id) {
        return carouselMapper.findById(id);
    }

    @Override
    public CarouselImage addCarouselImage(CarouselImage carouselImage) {
        carouselMapper.insert(carouselImage);
        return carouselImage;
    }

    @Override
    public CarouselImage updateCarouselImage(CarouselImage carouselImage) {
        carouselMapper.update(carouselImage);
        return carouselImage;
    }

    @Override
    public void deleteCarouselImage(Long id) {
        carouselMapper.deleteById(id);
    }

    @Override
    public void batchDeleteCarouselImages(List<Long> ids) {
        carouselMapper.batchDelete(ids);
    }
} 