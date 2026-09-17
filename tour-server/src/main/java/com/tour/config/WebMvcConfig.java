package com.tour.config;

import com.tour.interceptor.AdminTokenInterceptor;
import com.tour.interceptor.UserTokenInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final AdminTokenInterceptor adminTokenInterceptor;
    private final UserTokenInterceptor userTokenInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 管理端：除了登录，都要管理员令牌
        registry.addInterceptor(adminTokenInterceptor)
                .addPathPatterns("/api/admin/**")
                .excludePathPatterns("/api/admin/login");
        // 用户端：注册登录和浏览景点不用登录，其余要游客令牌
        registry.addInterceptor(userTokenInterceptor)
                .addPathPatterns("/api/user/**")
                .excludePathPatterns("/api/user/register", "/api/user/login",
                        "/api/user/districts", "/api/user/pois", "/api/user/pois/**");
    }
}
