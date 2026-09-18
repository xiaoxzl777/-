package com.tour.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * application.yml 里 tour 开头的配置。值只写在 application.yml，这里不再写默认值。
 */
@Data
@ConfigurationProperties(prefix = "tour")
public class TourProperties {

    private Admin admin = new Admin();
    private Jwt jwt = new Jwt();
    private Ai ai = new Ai();

    /** 固定的管理员账号 */
    @Data
    public static class Admin {
        private String username;
        private String password;
    }

    @Data
    public static class Jwt {
        private String secret;
        private int expireDays;
    }

    /** Python AI 服务 */
    @Data
    public static class Ai {
        private String baseUrl;
        private int timeoutSeconds;
    }
}
