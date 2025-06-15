package com.ikunmanager.service;

import com.ikunmanager.model.Announcement;

import java.util.List;

public interface AnnouncementService {
    List<Announcement> getAllAnnouncements();
    Announcement getAnnouncementById(Long id);
    Announcement addAnnouncement(Announcement announcement);
    Announcement updateAnnouncement(Announcement announcement);
    void deleteAnnouncement(Long id);
} 