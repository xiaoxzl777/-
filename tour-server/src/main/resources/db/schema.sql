-- 城市文旅行程规划平台：建表脚本（MySQL 8）
-- 后端每次启动时执行，表已存在就跳过。字段说明见 docs/数据库设计.md

CREATE TABLE IF NOT EXISTS sys_user (
    id         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    username   VARCHAR(32)  NOT NULL COMMENT '用户名',
    password   VARCHAR(100) NOT NULL COMMENT 'BCrypt 加密后的密码',
    nickname   VARCHAR(32)  NOT NULL COMMENT '昵称',
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_username (username)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '游客账号';

CREATE TABLE IF NOT EXISTS district (
    id         BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键',
    name       VARCHAR(50) NOT NULL COMMENT '片区名',
    sort       INT         NOT NULL DEFAULT 0 COMMENT '排序，数字小的在前',
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '旅游片区';

CREATE TABLE IF NOT EXISTS poi (
    id           BIGINT        NOT NULL AUTO_INCREMENT COMMENT '主键',
    type         VARCHAR(16)   NOT NULL COMMENT 'SCENIC 景点 / RESTAURANT 餐厅',
    name         VARCHAR(50)   NOT NULL COMMENT '名称',
    district_id  BIGINT        NOT NULL COMMENT '所属片区',
    admin_area   VARCHAR(20)   NULL COMMENT '行政区',
    address      VARCHAR(200)  NULL COMMENT '地址',
    lng          DECIMAL(10, 6) NOT NULL COMMENT '经度（GCJ-02）',
    lat          DECIMAL(10, 6) NOT NULL COMMENT '纬度（GCJ-02）',
    intro        TEXT          NULL COMMENT '简介',
    illustration VARCHAR(32)   NOT NULL COMMENT '插画名',
    official_url VARCHAR(255)  NULL COMMENT '官网地址',
    stay_minutes INT           NOT NULL COMMENT '建议游玩时长（分钟）',
    full_day     TINYINT       NOT NULL DEFAULT 0 COMMENT '是否全天型景点',
    ticket_price DECIMAL(10, 2) NULL COMMENT '门票参考价，0 表示免费',
    avg_cost     DECIMAL(10, 2) NULL COMMENT '人均消费（餐厅）',
    rating       DECIMAL(2, 1) NULL COMMENT '评分',
    tags         VARCHAR(200)  NULL COMMENT '标签，英文逗号分隔',
    status       VARCHAR(16)   NOT NULL DEFAULT 'ONLINE' COMMENT 'ONLINE 上线 / OFFLINE 下线',
    created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_district (district_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '景点和餐厅';

CREATE TABLE IF NOT EXISTS poi_open_rule (
    id              BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键',
    poi_id          BIGINT      NOT NULL COMMENT '景点',
    weekdays        VARCHAR(20) NOT NULL COMMENT '适用的星期，1 表示周一，英文逗号分隔',
    open_time       TIME        NOT NULL COMMENT '开门时间',
    close_time      TIME        NOT NULL COMMENT '关门时间',
    last_entry_time TIME        NULL COMMENT '停止入场时间',
    created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_poi (poi_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '开放时间';

CREATE TABLE IF NOT EXISTS poi_closed_date (
    id          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    poi_id      BIGINT       NOT NULL COMMENT '景点',
    closed_date DATE         NOT NULL COMMENT '闭馆日期',
    reason      VARCHAR(100) NULL COMMENT '原因',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_poi_date (poi_id, closed_date)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '闭馆日';

CREATE TABLE IF NOT EXISTS trip (
    id            BIGINT         NOT NULL AUTO_INCREMENT COMMENT '主键',
    user_id       BIGINT         NOT NULL COMMENT '所属用户',
    title         VARCHAR(50)    NOT NULL COMMENT '标题',
    trip_date     DATE           NOT NULL COMMENT '出行日期',
    prompt        VARCHAR(500)   NULL COMMENT '需求原话',
    start_time    TIME           NOT NULL COMMENT '出发时间',
    adults        TINYINT        NOT NULL COMMENT '成人数',
    seniors       TINYINT        NOT NULL COMMENT '老人数',
    children      TINYINT        NOT NULL COMMENT '儿童数',
    budget        DECIMAL(10, 2) NULL COMMENT '预算，为空表示不限',
    pace          VARCHAR(16)    NOT NULL COMMENT 'RELAXED / NORMAL / TIGHT',
    district_ids  VARCHAR(100)   NULL COMMENT '想去的片区 id，英文逗号分隔',
    must_poi_ids  VARCHAR(200)   NULL COMMENT '必去景点 id',
    avoid_poi_ids VARCHAR(200)   NULL COMMENT '不去景点 id',
    interests     VARCHAR(100)   NULL COMMENT '兴趣标签，英文逗号分隔',
    total_cost    DECIMAL(10, 2) NOT NULL COMMENT '预计总花费',
    created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_user (user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '行程';

CREATE TABLE IF NOT EXISTS trip_item (
    id           BIGINT         NOT NULL AUTO_INCREMENT COMMENT '主键',
    trip_id      BIGINT         NOT NULL COMMENT '所属行程',
    seq          INT            NOT NULL COMMENT '第几站',
    poi_id       BIGINT         NOT NULL COMMENT '景点或餐厅',
    start_time   TIME           NOT NULL COMMENT '开始时间',
    end_time     TIME           NOT NULL COMMENT '离开时间',
    cost         DECIMAL(10, 2) NOT NULL COMMENT '这一站的花费',
    next_mode    VARCHAR(16)    NULL COMMENT '去下一站的方式',
    next_minutes INT            NULL COMMENT '去下一站的耗时（分钟）',
    next_meters  INT            NULL COMMENT '去下一站的距离（米）',
    next_cost    DECIMAL(10, 2) NULL COMMENT '去下一站的交通费',
    created_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_trip (trip_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '行程里的每一站';
