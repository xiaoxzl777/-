package com.tour.controller.admin;

import com.tour.common.Result;
import com.tour.pojo.vo.AiStatusVO;
import com.tour.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 管理端：查询小萧能不能用，后台顶部据此显示提醒 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AiStatusAdminController {

    private final AdminService adminService;

    @GetMapping("/ai-status")
    public Result<AiStatusVO> aiStatus() {
        return Result.ok(adminService.aiStatus());
    }
}
