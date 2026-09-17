package com.tour.pojo.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DistrictDTO {

    @NotBlank(message = "请输入片区名")
    @Size(max = 50, message = "片区名最多 50 个字")
    private String name;

    @Min(value = 0, message = "排序不能小于 0")
    private Integer sort = 0;
}
