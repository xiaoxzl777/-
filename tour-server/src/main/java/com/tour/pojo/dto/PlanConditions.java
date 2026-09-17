package com.tour.pojo.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/** 规划条件：前端、后端和 AI 服务之间来回传的都是这个结构 */
@Data
public class PlanConditions {

    @NotNull(message = "请选择出行日期")
    private LocalDate date;

    @NotNull(message = "请选择出发时间")
    private LocalTime startTime;

    @NotNull(message = "请填写成人数")
    @Min(value = 1, message = "至少 1 位成人")
    @Max(value = 20, message = "成人最多 20 位")
    private Integer adults;

    @NotNull(message = "请填写老人数")
    @Min(value = 0, message = "老人数不能小于 0")
    @Max(value = 10, message = "老人最多 10 位")
    private Integer seniors;

    @NotNull(message = "请填写儿童数")
    @Min(value = 0, message = "儿童数不能小于 0")
    @Max(value = 10, message = "儿童最多 10 位")
    private Integer children;

    /** 为空表示不限 */
    @DecimalMin(value = "0", message = "预算不能小于 0")
    @DecimalMax(value = "100000", message = "预算最多 100000")
    private BigDecimal budget;

    @NotBlank(message = "请选择节奏")
    @Pattern(regexp = "RELAXED|NORMAL|TIGHT", message = "节奏只能是轻松、适中或紧凑")
    private String pace;

    private List<Long> districtIds = new ArrayList<>();
    private List<Long> mustPoiIds = new ArrayList<>();
    private List<Long> avoidPoiIds = new ArrayList<>();
    private List<String> interests = new ArrayList<>();
}
