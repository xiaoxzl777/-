package com.tour.pojo.vo;

import com.tour.pojo.dto.PlanConditions;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/** 规划结果（不入库，点“保存行程”才保存） */
@Data
public class PlanVO {

    private PlanConditions conditions;
    private List<PlanItemVO> items;
    private BigDecimal totalCost;
    private List<StepVO> steps;
    private List<String> warnings;
}
