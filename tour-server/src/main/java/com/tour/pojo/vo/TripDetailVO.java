package com.tour.pojo.vo;

import com.tour.pojo.dto.PlanConditions;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TripDetailVO {

    private Long id;
    private String title;
    private String prompt;
    private PlanConditions conditions;
    private List<PlanItemVO> items;
    private BigDecimal totalCost;
    private LocalDateTime createdAt;
}
