package com.tour.pojo.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** 我的行程列表里的一项 */
@Data
public class TripListVO {

    private Long id;
    private String title;
    private LocalDate tripDate;
    /** 景点数量（不含午餐） */
    private Integer stopCount;
    private BigDecimal totalCost;
    /** 封面插画：第一个景点的插画 */
    private String cover;
    private LocalDateTime createdAt;
}
