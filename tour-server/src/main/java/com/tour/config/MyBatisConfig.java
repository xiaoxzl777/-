package com.tour.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;

/**
 * 扫描 mapper 接口。单独放一个配置类，接口层的单元测试就不会去加载数据库相关的 Bean。
 */
@Configuration
@MapperScan("com.tour.mapper")
public class MyBatisConfig {
}
