package com.tour.service;

import com.tour.pojo.dto.LoginDTO;
import com.tour.pojo.vo.AdminLoginVO;
import com.tour.pojo.vo.AiStatusVO;

public interface AdminService {

    /** 管理员登录：核对配置文件里的固定账号 */
    AdminLoginVO login(LoginDTO dto);

    /** 小萧能不能用（Key 是否有效、余额够不够、AI 服务有没有启动） */
    AiStatusVO aiStatus();
}
