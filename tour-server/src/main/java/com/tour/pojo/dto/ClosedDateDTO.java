package com.tour.pojo.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ClosedDateDTO {

    @NotNull(message = "请选择日期")
    private LocalDate date;

    @Size(max = 100, message = "原因最多 100 个字")
    private String reason;
}
