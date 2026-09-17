package com.tour.service.impl;

import com.tour.common.BusinessException;
import com.tour.config.TourProperties;
import com.tour.pojo.dto.LoginDTO;
import com.tour.pojo.vo.AdminLoginVO;
import com.tour.service.AdminService;
import com.tour.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final TourProperties properties;
    private final JwtUtil jwtUtil;

    @Override
    public AdminLoginVO login(LoginDTO dto) {
        // 管理员只有一个固定账号，写在 application.yml 里：账号和密码都一致就直接发令牌，不查数据库
        TourProperties.Admin admin = properties.getAdmin();
        if (!admin.getUsername().equals(dto.getUsername()) || !admin.getPassword().equals(dto.getPassword())) {
            throw BusinessException.badRequest("账号或密码错误");
        }
        return new AdminLoginVO(jwtUtil.createToken(JwtUtil.ROLE_ADMIN, admin.getUsername()), "管理员");
    }
}
