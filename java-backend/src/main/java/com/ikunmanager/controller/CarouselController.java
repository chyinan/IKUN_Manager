package com.ikunmanager.controller;

import com.ikunmanager.common.ApiResponse;
import com.ikunmanager.model.CarouselImage;
import com.ikunmanager.service.CarouselService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/carousel")
public class
CarouselController {

    @Autowired
    private CarouselService carouselService;

    @Value("${file.upload-dir}")
    private String uploadBaseDir; // 注入配置的上传基础目录

    @GetMapping("/all")
    public ApiResponse<List<CarouselImage>> getAllCarouselImages() {
        List<CarouselImage> images = carouselService.getAllActiveCarouselImages();
        return ApiResponse.ok(images);
    }

    @GetMapping("")
    public ApiResponse<List<CarouselImage>> getActiveCarouselImagesForStudentPortal() {
        List<CarouselImage> images = carouselService.getAllActiveCarouselImages();
        return ApiResponse.ok(images);
    }

    @PostMapping("/add")
    public ApiResponse<CarouselImage> addCarouselImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "linkUrl", required = false) String linkUrl,
            @RequestParam(value = "displayOrder", required = false, defaultValue = "0") Integer displayOrder,
            @RequestParam(value = "isActive", required = false, defaultValue = "true") Boolean isActive) throws IOException {

        // 构建轮播图的完整上传目录 (绝对路径)
        Path carouselUploadPath = Paths.get(uploadBaseDir, "carousel").toAbsolutePath().normalize();
        if (!Files.exists(carouselUploadPath)) {
            Files.createDirectories(carouselUploadPath);
        }

        // 生成一个唯一的文件名
        String fileExtension = "";
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String fileName = UUID.randomUUID().toString() + fileExtension; // 使用UUID作为文件名
        Path filePath = carouselUploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // 存储到数据库的路径，只保留相对路径部分 (例如: carousel/uuid.jpg)
        String imageUrl = "carousel/" + fileName; 

        CarouselImage carouselImage = new CarouselImage();
        carouselImage.setImageUrl(imageUrl);
        carouselImage.setTitle(title);
        carouselImage.setLinkUrl(linkUrl);
        carouselImage.setDisplayOrder(displayOrder);
        carouselImage.setIsActive(isActive);

        CarouselImage newImage = carouselService.addCarouselImage(carouselImage);
        return ApiResponse.ok(newImage);
    }

    @DeleteMapping("/delete/{id}")
    public ApiResponse<Void> deleteCarouselImage(@PathVariable Long id) {
        carouselService.deleteCarouselImage(id);
        return ApiResponse.ok(null);
    }

    @PutMapping("/{id}")
    public ApiResponse<CarouselImage> updateCarouselImage(@PathVariable Long id, @RequestBody CarouselImage carouselImage) {
        carouselImage.setId(id);
        System.out.println("Received CarouselImage for update: " + carouselImage);
        CarouselImage updatedImage = carouselService.updateCarouselImage(carouselImage);
        return ApiResponse.ok(updatedImage);
    }
} 