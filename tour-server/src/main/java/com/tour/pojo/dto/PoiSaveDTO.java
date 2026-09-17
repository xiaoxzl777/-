package com.tour.pojo.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/** 管理端新增、修改景点 */
@Data
public class PoiSaveDTO {

    @NotBlank(message = "请选择类型")
    @Pattern(regexp = "SCENIC|RESTAURANT", message = "类型只能是景点或餐厅")
    private String type;

    @NotBlank(message = "请输入名称")
    @Size(max = 50, message = "名称最多 50 个字")
    private String name;

    @NotNull(message = "请选择片区")
    private Long districtId;

    @Size(max = 20, message = "行政区最多 20 个字")
    private String adminArea;

    @Size(max = 200, message = "地址最多 200 个字")
    private String address;

    @NotNull(message = "请输入经度")
    @DecimalMin(value = "73", message = "经度不在国内范围")
    @DecimalMax(value = "136", message = "经度不在国内范围")
    private BigDecimal lng;

    @NotNull(message = "请输入纬度")
    @DecimalMin(value = "3", message = "纬度不在国内范围")
    @DecimalMax(value = "54", message = "纬度不在国内范围")
    private BigDecimal lat;

    @Size(max = 2000, message = "简介最多 2000 个字")
    private String intro;

    @NotBlank(message = "请选择插画")
    @Size(max = 32)
    private String illustration;

    @Size(max = 255, message = "官网地址太长")
    @Pattern(regexp = "^$|^https?://\\S+$", message = "官网地址要以 http:// 或 https:// 开头")
    private String officialUrl;

    @NotNull(message = "请输入建议游玩时长")
    @Min(value = 10, message = "游玩时长至少 10 分钟")
    @Max(value = 720, message = "游玩时长最多 720 分钟")
    private Integer stayMinutes;

    private Boolean fullDay = false;

    @DecimalMin(value = "0", message = "门票价不能小于 0")
    private BigDecimal ticketPrice;

    @DecimalMin(value = "0", message = "人均消费不能小于 0")
    private BigDecimal avgCost;

    @DecimalMin(value = "0", message = "评分在 0 到 5 之间")
    @DecimalMax(value = "5", message = "评分在 0 到 5 之间")
    private BigDecimal rating;

    private List<String> tags = new ArrayList<>();
}
