package com.tour.pojo.entity;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** 景点和餐厅 */
@Data
public class Poi {

    public static final String SCENIC = "SCENIC";
    public static final String RESTAURANT = "RESTAURANT";
    public static final String ONLINE = "ONLINE";
    public static final String OFFLINE = "OFFLINE";

    private Long id;
    private String type;
    private String name;
    private Long districtId;
    private String adminArea;
    private String address;
    private BigDecimal lng;
    private BigDecimal lat;
    private String intro;
    private String illustration;
    private String officialUrl;
    private Integer stayMinutes;
    private Boolean fullDay;
    private BigDecimal ticketPrice;
    private BigDecimal avgCost;
    private BigDecimal rating;
    /** 标签，英文逗号分隔 */
    private String tags;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
