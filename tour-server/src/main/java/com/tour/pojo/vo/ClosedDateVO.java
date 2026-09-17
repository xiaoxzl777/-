package com.tour.pojo.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClosedDateVO {

    private Long id;
    private LocalDate date;
    private String reason;
}
