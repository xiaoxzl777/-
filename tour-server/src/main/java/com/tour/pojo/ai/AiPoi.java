package com.tour.pojo.ai;

import com.tour.pojo.vo.OpenRuleVO;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** 发给 AI 服务的景点数据 */
@Data
public class AiPoi {

    private Long id;
    private String type;
    private String name;
    private Long districtId;
    private BigDecimal lng;
    private BigDecimal lat;
    private Integer stayMinutes;
    private Boolean fullDay;
    private BigDecimal ticketPrice;
    private BigDecimal avgCost;
    private BigDecimal rating;
    private List<String> tags;
    private List<OpenRuleVO> openRules;
    private List<LocalDate> closedDates;
}
