package com.tour.controller.admin;

import com.tour.common.Result;
import com.tour.pojo.dto.LoginDTO;
import com.tour.pojo.vo.AdminLoginVO;
import com.tour.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 管理端：管理员登录 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminLoginController {

    private final AdminService adminService;

    @PostMapping("/login")
    public Result<AdminLoginVO> login(@RequestBody @Valid LoginDTO dto) {
        return Result.ok(adminService.login(dto));
    }
}
