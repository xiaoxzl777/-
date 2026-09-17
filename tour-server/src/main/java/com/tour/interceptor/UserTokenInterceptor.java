package com.tour.interceptor;

import com.tour.common.UserContext;
import com.tour.util.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 用户端拦截器：请求必须带游客令牌，并把游客 id 存进 UserContext。
 */
@Component
@RequiredArgsConstructor
public class UserTokenInterceptor implements HandlerInterceptor {

    private final JwtUtil jwtUtil;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod)) {
            return true;
        }
        Claims claims = jwtUtil.requireRole(request.getHeader(HttpHeaders.AUTHORIZATION), JwtUtil.ROLE_USER);
        UserContext.setUserId(Long.valueOf(claims.getSubject()));
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        UserContext.clear();
    }
}
