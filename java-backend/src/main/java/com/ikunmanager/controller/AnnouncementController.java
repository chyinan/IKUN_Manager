package com.ikunmanager.controller;

import com.ikunmanager.common.ApiResponse;
import com.ikunmanager.model.Announcement;
import com.ikunmanager.service.AnnouncementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {

    @Autowired
    private AnnouncementService announcementService;

    @GetMapping("/all")
    public ApiResponse<List<Announcement>> getAllAnnouncements() {
        List<Announcement> announcements = announcementService.getAllAnnouncements();
        return ApiResponse.ok(announcements);
    }

    @GetMapping("")
    public ApiResponse<List<Announcement>> getAnnouncementsForStudentPortal() {
        List<Announcement> announcements = announcementService.getAllAnnouncements();
        return ApiResponse.ok(announcements);
    }

    @GetMapping("/{id}")
    public ApiResponse<Announcement> getAnnouncementById(@PathVariable Long id) {
        Announcement announcement = announcementService.getAnnouncementById(id);
        if (announcement != null) {
            return ApiResponse.ok(announcement);
        } else {
            return ApiResponse.error(404, "Announcement not found.");
        }
    }

    @PostMapping("/add")
    public ApiResponse<Announcement> addAnnouncement(@RequestBody Announcement announcement) {
        Announcement newAnnouncement = announcementService.addAnnouncement(announcement);
        return ApiResponse.ok(newAnnouncement);
    }

    @PutMapping("/{id}")
    public ApiResponse<Announcement> updateAnnouncement(@PathVariable Long id, @RequestBody Announcement announcement) {
        announcement.setId(id);
        Announcement updatedAnnouncement = announcementService.updateAnnouncement(announcement);
        return ApiResponse.ok(updatedAnnouncement);
    }

    @DeleteMapping("/delete/{id}")
    public ApiResponse<Void> deleteAnnouncement(@PathVariable Long id) {
        announcementService.deleteAnnouncement(id);
        return ApiResponse.ok(null);
    }
} 