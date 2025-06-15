package com.ikunmanager.service;

import com.ikunmanager.mapper.SystemLogMapper;
import com.ikunmanager.model.SystemLog;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class SystemLogService {

    @Autowired
    private SystemLogMapper systemLogMapper;

    public PageInfo<SystemLog> getLogsByPage(String type, String operation, String content, String operator, String startDate, String endDate, int pageNum, int pageSize) {
        PageHelper.startPage(pageNum, pageSize);
        List<SystemLog> logList = systemLogMapper.findByPage(type, operation, content, operator, startDate, endDate);
        return new PageInfo<>(logList);
    }

    public int deleteLogs(List<Long> ids) {
        return systemLogMapper.deleteByIds(ids);
    }

    public int addLog(SystemLog systemLog) {
        return systemLogMapper.insert(systemLog);
    }
}