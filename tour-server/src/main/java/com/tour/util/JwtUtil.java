package com.tour.util;

import com.tour.common.BusinessException;
import com.tour.common.ErrorCode;
import com.tour.config.TourProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;

/**
 * 登录令牌（JWT）。令牌里保存角色和身份：游客是用户 id，管理员是账号名。
 */
@Component
public class JwtUtil {

    public static final String ROLE_USER = "USER";
    public static final String ROLE_ADMIN = "ADMIN";
    private static final String BEARER = "Bearer ";

    private final SecretKey key;
    private final long expireMillis;

    public JwtUtil(TourProperties properties) {
        this.key = Keys.hmacShaKeyFor(properties.getJwt().getSecret().getBytes(StandardCharsets.UTF_8));
        this.expireMillis = Duration.ofDays(properties.getJwt().getExpireDays()).toMillis();
    }

    public String createToken(String role, String subject) {
        Date now = new Date();
        return Jwts.builder()
                .subject(subject)
                .claim("role", role)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expireMillis))
                .signWith(key)
                .compact();
    }

    /**
     * 检查请求头里的令牌是不是指定角色的，是的话返回令牌内容。
     *
     * @param authorization 请求头 Authorization 的值，格式为 "Bearer 令牌"
     */
    public Claims requireRole(String authorization, String role) {
        if (authorization == null || !authorization.startsWith(BEARER)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "请先登录");
        }
        Claims claims;
        try {
            claims = Jwts.parser().verifyWith(key).build()
                    .parseSignedClaims(authorization.substring(BEARER.length()))
                    .getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "登录已过期，请重新登录");
        }
        if (!role.equals(claims.get("role", String.class))) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "没有权限访问");
        }
        return claims;
    }
}
