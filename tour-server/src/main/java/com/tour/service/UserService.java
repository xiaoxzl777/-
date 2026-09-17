package com.tour.service;

import com.tour.pojo.dto.LoginDTO;
import com.tour.pojo.dto.RegisterDTO;
import com.tour.pojo.vo.LoginVO;
import com.tour.pojo.vo.UserVO;

public interface UserService {

    UserVO register(RegisterDTO dto);

    LoginVO login(LoginDTO dto);

    UserVO getById(Long id);
}
