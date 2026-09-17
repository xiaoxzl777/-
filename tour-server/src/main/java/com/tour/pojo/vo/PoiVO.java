package com.tour.pojo.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/** 景点列表里的一项 */
@Data
public class PoiVO {

    private Long id;
    private String type;
    private String name;
    private Long districtId;
    private String districtName;
    private String illustration;
    private Integer stayMinutes;
    private Boolean fullDay;
    private BigDecimal ticketPrice;
    private BigDecimal avgCost;
    private BigDecimal rating;
    private List<String> tags;
    private String officialUrl;
    private String status;
}
