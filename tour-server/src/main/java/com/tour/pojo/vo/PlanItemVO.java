package com.tour.pojo.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalTime;

/** 行程里的一站：时间、费用、交通来自 AI 服务，名称、插画、坐标、官网由后端补上 */
@Data
public class PlanItemVO {

    private Integer seq;
    private Long poiId;
    private String name;
    private String type;
    private String illustration;
    private BigDecimal lng;
    private BigDecimal lat;
    private String officialUrl;
    private LocalTime startTime;
    private LocalTime endTime;
    private BigDecimal cost;
    private String nextMode;
    private Integer nextMinutes;
    private Integer nextMeters;
    private BigDecimal nextCost;
}
