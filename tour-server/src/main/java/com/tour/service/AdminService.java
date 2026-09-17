package com.tour.service;

import com.tour.pojo.dto.LoginDTO;
import com.tour.pojo.vo.AdminLoginVO;

public interface AdminService {

    /** 管理员登录：核对配置文件里的固定账号 */
    AdminLoginVO login(LoginDTO dto);
}
