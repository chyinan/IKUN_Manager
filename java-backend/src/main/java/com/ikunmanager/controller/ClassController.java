package com.ikunmanager.controller;

import com.ikunmanager.common.ApiResponse;
import com.ikunmanager.model.IkunClass;
import com.ikunmanager.service.ClassService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/class")
public class ClassController {

    @Autowired
    private ClassService classService;

    @GetMapping("/list")
    public ApiResponse<List<IkunClass>> getClassList(@RequestParam(required = false) String className) {
        return ApiResponse.ok(classService.getAllClasses(className));
    }

    @PostMapping("/add")
    public ApiResponse<IkunClass> addClass(@RequestBody IkunClass ikunClass) {
        IkunClass newClass = classService.addClass(ikunClass);
        return ApiResponse.ok(newClass);
    }

    @PutMapping("/update")
    public ApiResponse<IkunClass> updateClass(@RequestBody IkunClass ikunClass) {
        IkunClass updatedClass = classService.updateClass(ikunClass);
        return ApiResponse.ok(updatedClass);
    }

    @DeleteMapping("/delete/{id}")
    public ApiResponse<Void> deleteClass(@PathVariable Long id) {
        classService.deleteClass(id);
        return ApiResponse.ok(null);
    }

    @GetMapping("/{id}")
    public ApiResponse<IkunClass> getClassById(@PathVariable Long id) {
        IkunClass ikunClass = classService.getClassById(id);
        if (ikunClass != null) {
            return ApiResponse.ok(ikunClass);
        } else {
            return ApiResponse.error(HttpStatus.NOT_FOUND.value(), "Class not found");
        }
    }
} 