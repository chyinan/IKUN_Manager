package com.ikunmanager.service.impl;

import com.ikunmanager.model.Announcement;
import com.ikunmanager.mapper.AnnouncementMapper;
import com.ikunmanager.service.AnnouncementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AnnouncementServiceImpl implements AnnouncementService {

    @Autowired
    private AnnouncementMapper announcementMapper;

    @Override
    public List<Announcement> getAllAnnouncements() {
        return announcementMapper.findAll();
    }

    @Override
    public Announcement getAnnouncementById(Long id) {
        return announcementMapper.findById(id);
    }

    @Override
    public Announcement addAnnouncement(Announcement announcement) {
        announcementMapper.insert(announcement);
        return announcement;
    }

    @Override
    public Announcement updateAnnouncement(Announcement announcement) {
        announcementMapper.update(announcement);
        return announcement;
    }

    @Override
    public void deleteAnnouncement(Long id) {
        announcementMapper.deleteById(id);
    }
} 