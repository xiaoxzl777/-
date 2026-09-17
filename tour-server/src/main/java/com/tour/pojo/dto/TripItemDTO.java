package com.tour.pojo.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalTime;

/** 保存行程时的一站（前端把规划结果原样带回，多余的字段会被忽略） */
@Data
public class TripItemDTO {

    @NotNull
    private Integer seq;

    @NotNull(message = "缺少地点")
    private Long poiId;

    @NotNull(message = "缺少开始时间")
    private LocalTime startTime;

    @NotNull(message = "缺少结束时间")
    private LocalTime endTime;

    @NotNull
    @Min(0)
    private BigDecimal cost;

    @Pattern(regexp = "WALK|METRO|TAXI", message = "交通方式不对")
    private String nextMode;

    private Integer nextMinutes;
    private Integer nextMeters;
    private BigDecimal nextCost;
}
