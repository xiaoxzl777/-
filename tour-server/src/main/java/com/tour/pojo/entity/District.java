package com.tour.pojo.entity;

import lombok.Data;

import java.time.LocalDateTime;

/** 旅游片区 */
@Data
public class District {

    private Long id;
    private String name;
    private Integer sort;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
