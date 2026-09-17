package com.tour.service.impl;

import com.tour.common.BusinessException;
import com.tour.common.ErrorCode;
import com.tour.mapper.UserMapper;
import com.tour.pojo.dto.LoginDTO;
import com.tour.pojo.dto.RegisterDTO;
import com.tour.pojo.entity.User;
import com.tour.pojo.vo.LoginVO;
import com.tour.pojo.vo.UserVO;
import com.tour.service.UserService;
import com.tour.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Override
    public UserVO register(RegisterDTO dto) {
        if (userMapper.selectByUsername(dto.getUsername()) != null) {
            throw BusinessException.badRequest("用户名已被注册");
        }
        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setNickname(StringUtils.hasText(dto.getNickname()) ? dto.getNickname().trim() : dto.getUsername());
        try {
            userMapper.insert(user);
        } catch (DuplicateKeyException e) {
            throw BusinessException.badRequest("用户名已被注册"); // 两个人同时注册同一个用户名
        }
        return toVO(user);
    }

    @Override
    public LoginVO login(LoginDTO dto) {
        User user = userMapper.selectByUsername(dto.getUsername());
        if (user == null || !passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw BusinessException.badRequest("用户名或密码错误");
        }
        String token = jwtUtil.createToken(JwtUtil.ROLE_USER, user.getId().toString());
        return new LoginVO(token, toVO(user));
    }

    @Override
    public UserVO getById(Long id) {
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "账号不存在，请重新登录");
        }
        return toVO(user);
    }

    private UserVO toVO(User user) {
        return new UserVO(user.getId(), user.getUsername(), user.getNickname());
    }
}
