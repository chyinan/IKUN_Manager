package com.ikunmanager.controller;

import com.ikunmanager.model.SystemLog;
import com.ikunmanager.service.SystemLogService;
import com.ikunmanager.common.ApiResponse;
import com.github.pagehelper.PageInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/log")
public class SystemLogController {

    @Autowired
    private SystemLogService systemLogService;

    /**
     * 分页查询系统日志
     *
     * @param type 日志类型 (可选)
     * @param operation 操作类型 (可选)
     * @param content 日志内容 (可选)
     * @param operator 操作人 (可选)
     * @param startDate 开始日期 (可选)
     * @param endDate 结束日期 (可选)
     * @param pageNum 当前页码
     * @param pageSize 每页大小
     * @return 分页的日志数据
     */
    @GetMapping("/list")
    public ApiResponse<PageInfo<SystemLog>> getLogList(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String operation,
            @RequestParam(required = false) String content,
            @RequestParam(required = false) String operator,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        PageInfo<SystemLog> pageInfo = systemLogService.getLogsByPage(
                type, operation, content, operator, startDate, endDate, pageNum, pageSize);
        return ApiResponse.ok(pageInfo);
    }

    /**
     * 批量删除系统日志
     *
     * @param ids 待删除日志的ID列表
     * @return 操作结果
     */
    @DeleteMapping("/batchDelete")
    public ApiResponse<Void> batchDeleteLogs(@RequestBody List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return ApiResponse.error(400, "请选择要删除的日志");
        }
        int affectedRows = systemLogService.deleteLogs(ids);
        if (affectedRows > 0) {
            return ApiResponse.<Void>ok("成功删除 " + affectedRows + " 条日志", null);
        } else {
            return ApiResponse.error(500, "删除失败或未找到匹配日志");
        }
    }
} 