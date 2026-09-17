package com.tour.pojo.vo;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.util.List;

/** 景点详情：列表字段 + 地址、坐标、简介、开放时间、闭馆日 */
@Data
@EqualsAndHashCode(callSuper = true)
public class PoiDetailVO extends PoiVO {

    private String adminArea;
    private String address;
    private BigDecimal lng;
    private BigDecimal lat;
    private String intro;
    private List<OpenRuleVO> openRules;
    private List<ClosedDateVO> closedDates;
}
