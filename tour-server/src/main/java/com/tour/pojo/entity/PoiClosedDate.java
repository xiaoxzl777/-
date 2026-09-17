package com.tour.pojo.entity;

import lombok.Data;

import java.time.LocalDate;

/** 闭馆日 */
@Data
public class PoiClosedDate {

    private Long id;
    private Long poiId;
    private LocalDate closedDate;
    private String reason;
}
