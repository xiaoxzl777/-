package com.tour.pojo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class PoiStatusDTO {

    @NotBlank(message = "请选择状态")
    @Pattern(regexp = "ONLINE|OFFLINE", message = "状态只能是上线或下线")
    private String status;
}
