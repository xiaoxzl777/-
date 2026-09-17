package com.tour.pojo.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** 改了条件标签或删站后，按条件重排 */
@Data
public class PlanDTO {

    @NotNull(message = "缺少规划条件")
    @Valid
    private PlanConditions conditions;
}
