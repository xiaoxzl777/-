package com.tour.pojo.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/** 保存行程 */
@Data
public class TripSaveDTO {

    @NotBlank(message = "请输入行程标题")
    @Size(max = 50, message = "标题最多 50 个字")
    private String title;

    /** 需求原话，超过 500 字会被截断 */
    private String prompt;

    @NotNull(message = "缺少规划条件")
    @Valid
    private PlanConditions conditions;

    @NotEmpty(message = "行程里没有地点")
    @Size(max = 20, message = "行程最多 20 站")
    private List<@Valid TripItemDTO> items;

    @NotNull
    @DecimalMin("0")
    private BigDecimal totalCost;
}
