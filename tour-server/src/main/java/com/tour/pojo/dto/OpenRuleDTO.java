package com.tour.pojo.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalTime;
import java.util.List;

/** 一条开放时间规则 */
@Data
public class OpenRuleDTO {

    @NotEmpty(message = "请选择开放的星期")
    private List<@NotNull @Min(value = 1, message = "星期只能是 1 到 7") @Max(value = 7, message = "星期只能是 1 到 7") Integer> weekdays;

    @NotNull(message = "请输入开门时间")
    private LocalTime openTime;

    @NotNull(message = "请输入关门时间")
    private LocalTime closeTime;

    private LocalTime lastEntryTime;
}
