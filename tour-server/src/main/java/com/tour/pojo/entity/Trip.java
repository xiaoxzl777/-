package com.tour.pojo.entity;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/** 行程 */
@Data
public class Trip {

    private Long id;
    private Long userId;
    private String title;
    private LocalDate tripDate;
    private String prompt;
    private LocalTime startTime;
    private Integer adults;
    private Integer seniors;
    private Integer children;
    private BigDecimal budget;
    private String pace;
    private String districtIds;
    private String mustPoiIds;
    private String avoidPoiIds;
    private String interests;
    private BigDecimal totalCost;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
