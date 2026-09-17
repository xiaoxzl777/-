package com.tour.pojo.entity;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalTime;

/** 行程里的一站 */
@Data
public class TripItem {

    private Long id;
    private Long tripId;
    private Integer seq;
    private Long poiId;
    private LocalTime startTime;
    private LocalTime endTime;
    private BigDecimal cost;
    private String nextMode;
    private Integer nextMinutes;
    private Integer nextMeters;
    private BigDecimal nextCost;
}
