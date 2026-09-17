package com.tour.pojo.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

/** 景点列表的查询条件 */
@Data
public class PoiQueryDTO {

    private Long districtId;
    /** SCENIC / RESTAURANT */
    private String type;
    private String keyword;
    /** ONLINE / OFFLINE，只有管理端能用 */
    private String status;

    @Min(value = 1, message = "页码从 1 开始")
    private int page = 1;

    @Min(value = 1, message = "每页至少 1 条")
    @Max(value = 100, message = "每页最多 100 条")
    private int size = 10;

    /** 分页查询跳过的条数，给 SQL 的 OFFSET 用 */
    public int getOffset() {
        return (page - 1) * size;
    }
}
