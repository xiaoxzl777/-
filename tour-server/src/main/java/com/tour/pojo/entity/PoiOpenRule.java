package com.tour.pojo.entity;

import lombok.Data;

import java.time.LocalTime;

/** 开放时间 */
@Data
public class PoiOpenRule {

    private Long id;
    private Long poiId;
    /** 适用的星期，英文逗号分隔，1 表示周一 */
    private String weekdays;
    private LocalTime openTime;
    private LocalTime closeTime;
    private LocalTime lastEntryTime;
}
