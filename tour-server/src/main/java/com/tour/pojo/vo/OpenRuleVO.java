package com.tour.pojo.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OpenRuleVO {

    private List<Integer> weekdays;
    private LocalTime openTime;
    private LocalTime closeTime;
    private LocalTime lastEntryTime;
}
