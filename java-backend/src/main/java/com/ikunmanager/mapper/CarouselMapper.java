package com.ikunmanager.mapper;

import com.ikunmanager.model.CarouselImage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface CarouselMapper {
    List<CarouselImage> findAllActive();
    CarouselImage findById(@Param("id") Long id);
    int insert(CarouselImage carouselImage);
    int update(CarouselImage carouselImage);
    int deleteById(@Param("id") Long id);
    int batchDelete(@Param("ids") List<Long> ids);
} 