package com.tour.interceptor;

import com.tour.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 管理端拦截器：请求必须带管理员令牌。
 */
@Component
@RequiredArgsConstructor
public class AdminTokenInterceptor implements HandlerInterceptor {

    private final JwtUtil jwtUtil;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod)) {
            return true; // 不是接口方法（比如静态资源、跨域预检），直接放行
        }
        jwtUtil.requireRole(request.getHeader(HttpHeaders.AUTHORIZATION), JwtUtil.ROLE_ADMIN);
        return true;
    }
}
